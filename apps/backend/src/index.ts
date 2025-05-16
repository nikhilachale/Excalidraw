import express from "express";
import { prismaClient } from "@repo/db/client";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import jwt from "jsonwebtoken";

 import { JWT_SECRET } from '@repo/common-backend/config';

const app=express();
app.use(express.json());


app.post("/signup",(req,res)=>{

  const parsedData=CreateUserSchema.safeParse(req.body);
  if(!parsedData.success){
    console.log("incorrect input:  ",parsedData.error);
    res.json({
      message :"incorrect inputs"
    })
    return 

  }

  const data=parsedData.data;
  console.log("data: ",data);
  
})



app.post("/signin", async (req,res)=>{
  const { email,password}=req.body;
  const parsedData=SigninSchema.safeParse(req.body);
  if(!parsedData.success){
    console.log("incorrect input:  ",parsedData.error);
    res.json({
      message :"incorrect inputs"
    })
    return 

  }

  const data=parsedData.data;
  try{
    const user= await prismaClient.user.findUnique({
      where:{
        email:data.username,
        password:data.password
      }
    })
    if(!user){
      res.json({
         message:"user not found check credentials"
      })
    }
    const token =jwt.sign({
      userId:user.id,
    },JWT_SECRET)
    res.json({
      token,

    })
  }
  catch{
    res.json({
      message:"error in signing in"
    })
  }
  finally{
    prismaClient.$disconnect();
  }
  
})



app.post("/room",async(req,res)=>{
  const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
     const userId = req.userId;
     try{
      const room=await prismaClient.room.create({
        data:{
           slug: parsedData.data.name,
                adminId: userId
        }
      })
       res.json({
            roomId: room.id
        })
     }
     catch(err)
     {
      console.log("error in creating room: ",err);
     }

})

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});