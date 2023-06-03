import express, { NextFunction, Request } from "express";
import { v4 } from "uuid";

import { prisma } from "app";

export const listClasses = async (
  req: Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const data = await prisma.class.findMany({
      include: { course: { include: { category: {}, tasks: {} } } },
    });
    const customData = await Promise.all(
      data.map(async (c) => {
        const enrolled = await prisma.enrollment.findFirst({
          where: { userId: req.user?.id, classId: c.id },
        });
        const test = { ...c, enrolled: !!enrolled };
        return test;
      })
    );

    return res.status(200).json({ data: customData, errors: [] });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const createClass = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    // TODO: verificar se o curso existe
    const { courseId, start_date, end_date } = req.body;
    const data = await prisma.class.create({
      data: {
        start_date,
        end_date,
        course: { connect: { id: Number(courseId) } },
      },
    });
    return res.status(200).json({ data, errors: [] });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const deleteClass = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const courseId = req.params.id;
    const response = await prisma.class.delete({
      where: { id: Number(courseId) },
    });
    return res.status(200).json({ data: response, errors: [] });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const editClass = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.body;
    const data = await prisma.class.update({
      data: { start_date, end_date },
      where: { id: Number(id) },
    });
    return res.status(200).json({ data, errors: [] });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const generateCertificates = async (
  req: express.Request,
  res: express.Response,
  next: NextFunction
) => {
  try {
    const { courseId, classId } = req.body;

    const enrolledUsers = (
      await prisma.enrollment.findMany({ where: { class: { id: classId } } })
    ).map((e) => e.userId);
    const courseTotalTasks = (
      await prisma.courseTask.findMany({ where: { course: { id: courseId } } })
    ).length;
    const minQtdToGetCertificate = Math.round(0.9 * courseTotalTasks);

    enrolledUsers.forEach(async (userId) => {
      const alreadyHasCertificate = !!(await prisma.certificate.findFirst({
        where: { user: { id: userId }, class: { id: classId } },
      }));

      const userTotalCompletedTasks = (
        await prisma.completedTask.findMany({
          where: { user: { id: userId } },
        })
      ).length;

      if (userTotalCompletedTasks >= minQtdToGetCertificate && !alreadyHasCertificate) {
        const uuid = v4();
        await prisma.certificate.create({
          data: {
            uuid,
            user: { connect: { id: userId } },
            class: { connect: { id: classId } },
          },
        });
      }
    });

    return res.status(200).json({ data: {}, errors: [] });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
