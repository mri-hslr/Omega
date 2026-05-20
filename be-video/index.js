import "dotenv/config";
import express, { json } from "express"
import pool from "./db.js";
import axios from "axios"
import https from "https"
import cors from "cors"
import getlanding from "./services/getLanding.js";
// import { Check } from "./cache/Redisops.js";
// import { Setex } from "./cache/Redisops.js";
// import redis from "./redisClient.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser";
const app=express()
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173',
        'https://omega-v4gh.vercel.app'
    ],
    credentials: true,               // Explicitly allow cookies
}));
app.use(express.json());

const tmdbAgent = new https.Agent({ keepAlive: true });

let id_store=[]
let landing_store=[];
//middleware to authenticate the user using jwt token
const verifyToken=(req,res,next)=>{
  const token =req.cookies.token
  if(!token){
    return res.status(401).json({message:"Unauthorized"})
  }
  try{
    const decoded=jwt.verify(token,process.env.JWT_SECRET)
    req.userId=decoded.id
    next()
  }
  catch(err){
    return res.status(401).json({message:"Unauthorized"})
  }
}
app.post("/signup",async (req,res)=>{
    try{
      //input validation
      const{username,email,password}=req.body;
      if(!username||!password||!email){
         res.status(400).json({message:"all fields are required"})
      }
      if(typeof username!=="string"||typeof password!=="string"||typeof email!=="string"){
        res.status(400).json({message:"invalid input"});
      }
      if(password.length<8){
        res.status(400).json({message:"password should be atleast 8 characters long"})
      }
      //check if user already exists
      const userCheck=await pool.query("SELECT *FROM users where email=$1",[email])
      if(userCheck.rows.length>0){
        return  res.status(400).json({message:"User already exists with this email"})
      }
      const hashedPassword=await bcrypt.hash(password,10);
      const newUser=await pool.query("INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING *",[username,email,hashedPassword])
      const token=jwt.sign({id:newUser.rows[0].id},process.env.JWT_SECRET,{expiresIn:"7d"})
      res.cookie(
        "token",token,{
          httpOnly:true,
          secure:process.env.NODE_ENV==="production",
          sameSite:"strict",
          maxAge:7*24*60*60*1000
        }
      )

  res.status(201).json({message:"User created successfully"})
  }
    catch(err){
      res.status(500).json({message:"Internal server error"})
    }
})
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (userCheck.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });
        
        const user = userCheck.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: "Login successful", user: { id: user.id, username: user.username } });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
});
app.get("/landing",async (req,res)=>{
    //using layered caching : in memory->redis server -> api call
    const selectedMedia=req.query.selectedMedia
    const currentTime=Date.now()
    // const cached=await Check('landing')
    // if(landing_store[0] && landing_store[0].time-currentTime<900000){
    //     return res.json({
    //         trending:landing_store[0].trending,
    //         popular:landing_store[0].popular,
    //         top_rated:landing_store[0].top_rated
    //     })
    // }

    // if(cached!=null){
    //     landing_store[0]={time:currentTime,...cached}
    //     return res.send(cached)
    // }
    console.log("fetching from api")
    const data=await getlanding(tmdbAgent)
    // landing_store[0]={time:currentTime,...data}
    // await Setex('landing',3600,data)
    res.send(data);
})

app.get("/search",async (req,res)=>{
    let search_query=req.query.search_query//check the search query , it should be present and a string , convert it into lowercase 
    const selectedMedia=req.query.selectedMedia//make sure the frontend selects the same (either movie or tv)
    search_query=search_query.toLowerCase();
    const filter=id_store.filter((m)=>{return m.search_query==search_query})
    if(filter.length!=0){
        console.log("insid filter",filter);
       return res.send(filter[0].id);
    }
    //if not in filter then we'll resort to redis storage 
    else{
    const response = await axios.get(
        `https://api.themoviedb.org/3/search/${selectedMedia}?query=${search_query}&include_adult=false&language=en-US&page=1`,
        {
          httpsAgent: tmdbAgent,
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`,
          }, 
        }
      );
        //id_store.push({search_query:search_query,id:response.data.results[0].id})//lowercase one should be pushed to optimize cache hits 
      return res.send(response.data.results)//right now we are only giving him the top choice
    }
})


app.get("/details",async(req,res)=>{
    const movie_id=req.query.id
    const selectedMedia=req.query.selectedMedia
    const response = await axios.get(
        `https://api.themoviedb.org/3/${selectedMedia}/${movie_id}`,
        {
          httpsAgent: tmdbAgent,
          headers: {
            Authorization: `Bearer ${process.env.TOKEN}`,
          }, 
        }
      );
    //   res.json({
    //     episode_count:response.data.number_of_episodes,
    //     season_count:response.data.number_of_seasons
    //   })
    
    res.send(response.data);
})



app.get("/recc",async (req,res)=>{
    const id =req.query.id
    let url
    const selectedMedia=req.query.selectedMedia
    selectedMedia=="movie"?url=`https://api.themoviedb.org/3/movie/${id}/recommendations`:url=`https://api.themoviedb.org/3/tv/${id}/recommendations`
    const response=await axios.get(url,{
        httpsAgent: tmdbAgent,
        headers:{
            Authorization: `Bearer ${process.env.TOKEN}`,
        }
    })
    res.send(response.data.results)
})

app.get("/watchlist",verifyToken ,async (req,res)=>{
  try{
    const userId=req.userId
    const response=await pool.query("SELECT * FROM user_media_list where user_id=$1",[userId])
    console.log(response.rows)
    res.send(response.rows)
  }
  catch(err){
    res.status(500).json({message:"Internal server error"})
  }
    
})

app.post("/watchlist", verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { mediaId, mediaType, status } = req.body;

        if (!mediaId || !mediaType || !status) {
            return res.status(400).json({ message: "All fields are required" });
        }

        
        const formattedMediaType = mediaType.toUpperCase();

        const insertQuery = `INSERT INTO user_media_list (user_id, media_id, media_type, status) VALUES ($1, $2, $3, $4)`;
        
        // Pass formattedMediaType instead of mediaType
        await pool.query(insertQuery, [userId, mediaId, formattedMediaType, status]);

        res.status(201).json({ message: "Added to watchlist successfully" });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: "This media is already in your watchlist." });
        }
        console.error("Watchlist Insert Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.get("/api/profile", verifyToken, async (req, res) => {
    try {
        // 1. Try to find the profile
        let profileQuery = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
        
        // 2. If it doesn't exist (because they are a new user), create a blank one on the fly
        if (profileQuery.rows.length === 0) {
            const insertQuery = `
                INSERT INTO profiles (user_id, favorite_genres, top_movies, top_shows, top_anime) 
                VALUES ($1, '{}', '[]', '[]', '[]') RETURNING *
            `;
            profileQuery = await pool.query(insertQuery, [req.userId]);
        }
        
        res.status(200).json(profileQuery.rows[0]);
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.put("/api/profile", verifyToken, async (req, res) => {
    try {
        const { favorite_genres, top_movies, top_shows, top_anime } = req.body;
        
        const updateQuery = `
            UPDATE profiles 
            SET favorite_genres = COALESCE($1, favorite_genres),
                top_movies = COALESCE($2, top_movies),
                top_shows = COALESCE($3, top_shows),
                top_anime = COALESCE($4, top_anime),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $5
            RETURNING *
        `;
        
        const response = await pool.query(updateQuery, [
            favorite_genres, 
            JSON.stringify(top_movies), 
            JSON.stringify(top_shows), 
            JSON.stringify(top_anime), 
            req.userId
        ]);
        
        res.status(200).json(response.rows[0]);
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
//to update the status of the media in the watchlist (plan to watch, watching, completed)
app.put("/watchlist", verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { mediaId, status } = req.body;

        if (!mediaId || !status) {
            return res.status(400).json({ message: "Media ID and Status are required" });
        }

        const updateQuery = `
            UPDATE user_media_list 
            SET status = $1 
            WHERE user_id = $2 AND media_id = $3 
            RETURNING *
        `;
        
        const response = await pool.query(updateQuery, [status, userId, mediaId]);

        if (response.rows.length === 0) {
            return res.status(404).json({ message: "Media not found in your watchlist" });
        }

        res.status(200).json({ message: "Status updated successfully", updatedItem: response.rows[0] });
    } catch (err) {
        console.error("Watchlist Update Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Get specific media progress for resuming
app.get("/progress/:mediaId", verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const mediaId = req.params.mediaId;
        
        const response = await pool.query(
            "SELECT current_season, current_episode FROM user_media_list WHERE user_id = $1 AND media_id = $2",
            [userId, mediaId]
        );
        
        if (response.rows.length > 0) {
            res.status(200).json(response.rows[0]);
        } else {
            res.status(404).json({ message: "No progress found" });
        }
    } catch (err) {
        console.error("Progress Fetch Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Upsert (Update or Insert) progress silently
app.put("/progress", verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { mediaId, mediaType, season, episode } = req.body;

        const formattedMediaType = mediaType.toUpperCase();

        const upsertQuery = `
            INSERT INTO user_media_list (user_id, media_id, media_type, status, current_season, current_episode)
            VALUES ($1, $2, $3, 'ONGOING', $4, $5)
            ON CONFLICT (user_id, media_id) 
            DO UPDATE SET 
                status = 'ONGOING',
                current_season = EXCLUDED.current_season,
                current_episode = EXCLUDED.current_episode;
        `;
        
        await pool.query(upsertQuery, [userId, mediaId, formattedMediaType, season, episode]);

        res.status(200).json({ message: "Progress saved" });
    } catch (err) {
        console.error("Progress Save Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Check current user session
app.get("/me", verifyToken, async (req, res) => {
    try {
        // If verifyToken passes, we know they have a valid cookie
        const userQuery = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [req.userId]);
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Send the user info back to React
        res.status(200).json({ user: userQuery.rows[0] });
    } catch (err) {
        console.error("Session Check Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.listen(3000);