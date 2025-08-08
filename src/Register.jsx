
// ** Update the fetch url to the url hosted by the server

import { useState } from "react";
import './Register.css'

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


  async function handleSubmit(e){
    e.preventDefault();
    try{
      const res = await fetch("http://localhost:3000/app/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        setRegisterMsg("Server error: " + res.status);
        return;
      }
      const data = await res.json();
      if(data.success==true){
        setRegisterMsg(data.message);
        localStorage.setItem('userId',data.user._id)
        localStorage.setItem('username',data.user.username)
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
    <>
      {registerMsg && <div id="register-output">
        {registerMsg}
      </div>}
      <div>
        <form id="register-form"  onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" onChange={e=>setUsername(e.target.value)}/>
          <input type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)}/>
          <button type="submit">Submit</button>
        </form>
      </div>
    </>

  )

}

export default Register;