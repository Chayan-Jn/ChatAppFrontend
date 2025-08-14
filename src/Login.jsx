import { useState } from "react"
import { useNavigate } from "react-router-dom";
import './Login.css';

const Login = ()=>{
    const [username,setUsername] = useState('');
    const [password,setPassword] = useState('');
    const [loginMessage,setLoginMessage] = useState('');
    const navigate = useNavigate();


    async function handleSumbit(e){
        e.preventDefault();
        const res = await fetch('http://localhost:3000/app/login',{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({username,password}),
            credentials:"include"
        });
        if(!res.ok){
            setLoginMessage("Unable to Login! Please try again ");
            return;
        }
        const data = await res.json();
        setLoginMessage(data.message);
        setTimeout(()=>{
            navigate('/chat-app/home')
            console.log("Logged in, redirecting to home page")
        },500)
    }
    return (<div id="main">
        <h1 id="title">login</h1>
        {loginMessage && 
            <div id="login-output">
                <h1>{loginMessage}</h1>
            </div>
        }
        <form onSubmit={handleSumbit} id="login-form">
            <input type="text" required onChange={e=>setUsername(e.target.value)} value={username} placeholder="Username"/>
            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>
            <button type="submit" id="login-btn">Submit</button>
        </form> 
    </div>)
}

export default Login;