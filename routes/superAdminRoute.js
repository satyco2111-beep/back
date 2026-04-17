import { Router } from "express";
import { superAdminAuthMiddleware } from "../middleware/superAdminAuth.js";
import {
  superAdminLogin,
  superAdminLogout,
  superAdminDashboard,
  adminListUsers,
  adminDeleteUser,
  adminListProviders,
  adminDeleteProvider,
  adminListWorks,
  adminDeleteWork,
  adminUpdateWork,
  adminCreateCity,
  adminDeleteCity,
  adminCreateLocal,
  adminDeleteLocal,
  adminCreateService,
  adminDeleteService,
} from "../controllers/superAdminController.js";
import {
  listWithdrawalsSuperAdmin,
  updateWithdrawalSuperAdmin,
} from "../controllers/creditWithdrawalController.js";

const superAdminRouter = Router();

superAdminRouter.post("/login", superAdminLogin);
superAdminRouter.post("/logout", superAdminAuthMiddleware, superAdminLogout);
superAdminRouter.get("/dashboard", superAdminAuthMiddleware, superAdminDashboard);

superAdminRouter.get("/users", superAdminAuthMiddleware, adminListUsers);
superAdminRouter.delete("/users/:suid", superAdminAuthMiddleware, adminDeleteUser);

superAdminRouter.get("/providers", superAdminAuthMiddleware, adminListProviders);
superAdminRouter.delete("/providers/:sprovid", superAdminAuthMiddleware, adminDeleteProvider);

superAdminRouter.get("/works", superAdminAuthMiddleware, adminListWorks);
superAdminRouter.patch("/works/:swrid", superAdminAuthMiddleware, adminUpdateWork);
superAdminRouter.delete("/works/:swrid", superAdminAuthMiddleware, adminDeleteWork);

superAdminRouter.post("/cities", superAdminAuthMiddleware, adminCreateCity);
superAdminRouter.delete("/cities/:sctyid", superAdminAuthMiddleware, adminDeleteCity);

superAdminRouter.post("/locals", superAdminAuthMiddleware, adminCreateLocal);
superAdminRouter.delete("/locals/:sloctyid", superAdminAuthMiddleware, adminDeleteLocal);

superAdminRouter.post("/services", superAdminAuthMiddleware, adminCreateService);
superAdminRouter.delete("/services/:ssrvcid", superAdminAuthMiddleware, adminDeleteService);

superAdminRouter.get("/withdrawals", superAdminAuthMiddleware, listWithdrawalsSuperAdmin);
superAdminRouter.patch("/withdrawals/:swrid", superAdminAuthMiddleware, updateWithdrawalSuperAdmin);

export default superAdminRouter;

