import Express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { createUser, getUsers, deleteUser } from "../controllers/userController.js";

const router = Express.Router();

router.get("/users", authMiddleware, adminMiddleware, getUsers);
router.post("/users", authMiddleware, adminMiddleware, createUser);
router.delete("/users/:id", authMiddleware, adminMiddleware, deleteUser);


export default router;