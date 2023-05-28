import express, { Application } from 'express';

import { PrismaClient } from '@prisma/client'
import { attachRouters } from 'routes/attachRouters';

const app: Application = express();
export const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port: number = 3000;

attachRouters(app)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})