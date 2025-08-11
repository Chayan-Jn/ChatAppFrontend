import { useEffect, useState } from 'react'
import './HomePage.css'
import socket  from './socket';
import { BiSolidSend } from "react-icons/bi";

const HomePage = () => {
  const [searched,setSearched] = useState('');
  const [returnedUser,setReturnedUser] = useState(''); //{username,userId}
  const [chatHistory,setChatHistory] = useState([]);
  const [currentUser,setCurrentUser] = useState(null);
  const [msg,setMsg] = useState('')

  // fetch current user from session storage
  useEffect(()=>{
    async function fetchCurrentUser() {
      try{
        const userBasicData = {
          username:sessionStorage.getItem('username'),
          userId:sessionStorage.getItem('userId')
        }
        setCurrentUser(userBasicData)
        console.log('set current user as ',userBasicData);
      }
      catch(err){
        console.log(err)
      }
    }
    fetchCurrentUser();
  },[]);

  // logic for removing searched User output 
  useEffect(()=>{
    if(searched == "") setReturnedUser("");
  },[searched]);
  
  useEffect(()=>{
    if(!currentUser) return;
    try{
      socket.emit('loginUser',(currentUser.userId));

      socket.on('receive-msg',(receivedData)=>{
        setChatHistory(prev=>[...prev,receivedData])
      })
    }
    catch(err){
      console.log(err)
    }

    return ()=>{
      socket.off('receive-msg');
    }
    
  },[currentUser]);


  async function handleClick(e){
    e.preventDefault();
    const res = await fetch(`http://localhost:3000/app/${searched}`,{
      method:"GET",
      headers:{
        "Content-Type":"application/json"
      },
      credentials: "include",  //  Ensure cookies are included in the request
    });
    if(!res.ok){
      setReturnedUser('Not found')
      return;
    }
    const data = await res.json();
    setReturnedUser
    ({username:data.username,userId:data.userId}); 
  }
  async function openChat(e){
    console.log("open chat runs")
    e.preventDefault();
    const res = await fetch(`http://localhost:3000/app/chat/${searched}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"include"
    });
    if(!res.ok){
      console.log("Err fetching messages")
      return;
    }
    const data = await res.json();
    const messages = data.history;
    setChatHistory(messages);
    // console.log(typeof messages[0].sender.toString());
    // console.log(typeof returnedUser.userId);
    messages.map(msg => {
      console.log('Sender:', msg.sender, 'Returned User ID:', returnedUser.userId);
    });
    
  }
  const handleKeyDown = (e)=>{
    if(e.key == 'Enter') handleClick(e);
  }
  const handleSendMessage = (e)=>{
    if(e.key == 'Enter') sendMessage(e);
  }
  async function sendMessage(e) {
    e.preventDefault();
    const now = new Date();
    const createdAt =now.toISOString(); 
    const updatedAt =now.toISOString(); 
    const newMessage = {
      sender:currentUser.userId,
      receiver:returnedUser.userId,
      text:msg,
      createdAt,
      updatedAt
    }
    socket.emit('send-msg',
      {userId:returnedUser.userId,
        senderId:currentUser.userId,
        text:msg
      });
      //** Handle the image part later

      setChatHistory(prev=>[...prev,newMessage]);

      setMsg('')
  }


  return (
    <div className="container">
        <nav>
          <div>Home</div>
        </nav>
        <main>
          <div className='left'>
            <input type="text" placeholder='Search' className='user-search-input'
            onChange={e=>setSearched(e.target.value)}
            onKeyDown={handleKeyDown}/>
            <button className='user-search-btn' onClick={handleClick}>
              🔍
            </button>
            {!searched && <ul className='friend-list'>
              <div className='friend'>
                <img src="https://wallpapercave.com/w/wp8903722.jpg" alt="" />
                <li>a</li>
              </div>
              <div className='friend'>
                <img src="https://wallpapercave.com/w/wp8903722.jpg" alt="" />
                <li>b</li>
              </div>
              <div className='friend'>
                <img src="https://wallpapercave.com/w/wp8903722.jpg" alt="" />
                <li>c</li>
              </div>
            </ul>}
            {searched && 
              <ul className='friend-list'>
              { 
                returnedUser=="Not found" &&
                <div className='friend'>
                  <div className='not-found'>
                    User not found
                  </div>
                </div>
              }  
              {returnedUser && returnedUser!="Not found" &&
              <div className='friend' onClick={openChat}>
                <img src="https://wallpapercave.com/w/wp8903722.jpg" alt="" />
                <li>{returnedUser.username}</li>
              </div>
              }
              </ul>
      
            }
          </div>
          <div className='right'>
            <div className='right-nav'>
              <div className='user-name'>
                {returnedUser.username}
              </div>
            </div>
            <div  className='right-container'>
              { returnedUser &&
                chatHistory.map((msg,index)=>{
                  return(
                        <div key={index} className={msg.receiver == returnedUser.userId ? 'sender':'receiver'}>
                          {msg.text ? (
                            <p className='chat-msg'>
                            {msg.text}</p>): 
                            (msg.imageUrl && <img src={msg.imageUrl} alt='This image was not found' className='chat-img'/>)
                          }
                        </div>
                  )
                })
              }
            </div>
            <div className='send-msg'>
                  <div className='send-msg-input'>
                    <input placeholder='Enter a message' 
                    value={msg}
                    onChange={e=>setMsg(e.target.value)}
                    onKeyDown={handleSendMessage}/>
                  </div>
                  <div className='send-msg-btn'>
                    <BiSolidSend className='send-msg-btn-logo' onClick={sendMessage}/>
                  </div>
              </div>
          </div>
        </main>
    </div>
  )
}

export default HomePage;