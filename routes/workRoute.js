import { Router } from "express";
import { getAllWorks, getSingleWork, registerWork, updateWork, deleteWork, getWorksByUser,getWorksByProvider,byUserCanceleWork} from "../controllers/workController.js"
import {userAuthMiddleware} from "../middleware/userAuth.js"
import { providerAuthMiddleware } from "../middleware/providerAuth.js";


const workRouter = Router();

// workRouter.get("/",getAllWorks)
// workRouter.post("/register",registerWork)



// Route to get all works
workRouter.get('/', getAllWorks);

// Route to get a single work by ID
workRouter.get('/:id', getSingleWork);

// Route to register a new work
workRouter.post('/register', registerWork); 

// Route to update an existing work
workRouter.put('/:id', updateWork);
workRouter.put('/byUserCanceleWork/:id', byUserCanceleWork);
workRouter.put('/byuser/:id', userAuthMiddleware ,updateWork);
workRouter.put('/byprovider/:id',providerAuthMiddleware , updateWork);

// Route to delete a work by ID
workRouter.delete('/:id',providerAuthMiddleware, deleteWork);

// 
workRouter.get('/user/:id', getWorksByUser);
workRouter.get('/provider/:id', getWorksByProvider);





export default workRouter;




