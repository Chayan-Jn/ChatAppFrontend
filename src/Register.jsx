
// ** Update the fetch url to the url hosted by the server

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Register.css'


// Returned obj by fetch
// success: true,
// message: "User registered successfully",
// user: {
//     _id: newUser._id,
//     username: newUser.username
// }
const Register = ()=>{
  const [registerMsg,setRegisterMsg] = useState('');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e){
    e.preventDefault();
    try{
      const res = await fetch("http://localhost:3000/app/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials:"include"
      });

      const data = await res.json();
      if (!res.ok) {
        setRegisterMsg(data.message || "Server error: " + res.status + "");
        return;
      }
      if(data.success==true){
        setRegisterMsg(data.message);
        localStorage.setItem('userId',data.user._id)
        localStorage.setItem('username',data.user.username)

        // Login is successful so navigate to login page
        setTimeout(()=>{
          console.log('User Registered successfully, redirecting to login page')
          navigate('/chat-app/login')
        },1000)
      }
      else{ // data is there but success is false
        setRegisterMsg(data.message);
      }
    }
    catch(err){
      console.log('Error Fetching Data \n',err)
    }
  }
  return(
    <div id="main">
      <h1 id="title">Register</h1>
      {registerMsg && 
          <div id="register-output">
              {registerMsg}
          </div>
      }
      <form id="register-form"  onSubmit={handleSubmit}>
          <input type="text" required placeholder="Username" onChange={e=>setUsername(e.target.value)} value={username}/>
          <input type="password" required placeholder="Password" onChange={e=>setPassword(e.target.value)} value={password}/>
          <button type="submit" id="register-btn">Submit</button>
        </form> 
    </div>

  )

}

export default Register;