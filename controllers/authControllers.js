import db from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();


export const register = async (req, res) => {
    try {
    const { name, username, password, tel} = req.body;

    if(!username || !password || !name || !tel){
        return res.status(400).json({message: "No user data."});
    }

        //เช็คว่ามีข้อมูลซ้ำหรือไม่
        const checkUesrSql = "SELECT* FROM users WHERE username = $1";
        const checkUser = await db.query(checkUesrSql,[username]);
        // return res.json(checkUser.rowCount);

        //ถ้า username ซ้ำให้แจ้งว 400 มีชื่อนี้แล้ว
        if(checkUser.rowCount > 0){
            return res.status(400).json({message: "Username already exists."});
        }
        //ถ้าไม่ซ้ำ เพิ่มข้อมูลใน ตาราง users
        const insertSql =
         "INSERT INTO users(username, password, name, tel) VALUES ($1, $2, $3, $4) RETURNING *";

        const hash_password = await bcrypt.hash(password, 10); //เข้ารหัส password

        const newUser = await db.query(insertSql,[
            username, 
            hash_password, 
            name, 
            tel,
        ]);

        const user = newUser.rows[0];
        return res
            .status(201)
            .json({message:"User registered"});
    } catch (error) {
        return res.status(500).json({message: "error:"+ error});
    }

};

export const login = async (req, res) => {
    const { username, password } = req.body ??{};

    if (!username || !password) {
        return 
        res.status(400)
        .json({ message: "username & password are required" });
    }

    try {
        const userSql = "SELECT * FROM users WHERE username = $1 LIMIT 1";
        const {rows} = await db.query(userSql, [username])
        const user = rows[0];

        // return res.json({user});    //ทดสอบ login
        // ไม่มี ชื้อผู้ใช้
        if(!user){
            return res.status(400).json({message: "User not found"});
        }
        
        const checkPass = await bcrypt.compare(password, user.password)
        if(!checkPass){
            return res.status(400).json({message: "Wrong Password"});
        } 
       // username & password ถูกต้อง
       // สร้าง access token และ refresh token
        const payload ={
            userid: user.id,
            username: user.username,
            tel: user.tel
        }
       const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: "15m"
       });

       const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEYN_SECRET,{
        expiresIn: "15m"
       });
       //return payioad และ Tokens
       return res.status(200).json({payload, accessToken, refreshToken});


 } catch (error) {
    return res.status(500).json({ message: "Error: " + error });
}
}

export const refresh = async (req, res) => {
     const { token } = req.body;
     if (!token) return res.status(401).json({message: "No token"});

    jwt.verify(token, process.env.REFRESH_TOKEYN_SECRET,(err,user) =>{
        if (err) return res.status(403).json({ message: "Token expired."});

        const accessToken = jwt.sign({userid: user.id, username: user.username, tel: user.tel}, process.env.ACCESS_TOKEN_SECRET,
            {expiresIn: "15m"},
        );
        res.status(200).json({accessToken});
    });
}
