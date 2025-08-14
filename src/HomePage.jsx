import { useEffect, useRef, useState } from 'react'
import './HomePage.css'
import socket  from './socket';
import { BiSolidSend } from "react-icons/bi";

const HomePage = () => {
  const [searched,setSearched] = useState('');
  const [searchResult,setsearchResult] = useState({ username: '', userId: '' }); //{username,userId}
  const [searchError, setSearchError] = useState('');
  const [chatHistory,setChatHistory] = useState([]);
  const [currentUser,setCurrentUser] = useState(null);
  const [msg,setMsg] = useState('')
  const rightContainerRef = useRef(null);
  const [friendHistory,setFriendHistory] = useState([]); 

  // for reload
  useEffect(() => {
    setSearched('');
    setsearchResult({ username: '', userId: '' });
    setChatHistory([]);
    setFriendHistory(JSON.parse(sessionStorage.getItem('friend-history')) || [])
  }, []);
  

  // fetching current user from session storage
  useEffect(() => {
    async function fetchCurrentUser() {
      console.log('fetchCurrentUser runs')
        try {
            const res = await fetch('http://localhost:3000/app/get-current-user', {
                credentials: 'include'
            });
            if (!res.ok) return;

            const data = await res.json();
            const user = data.data; // {username, userId}

            // If user changes, clear friendHistory
          if (!currentUser || currentUser.userId !== user.userId) {
            setFriendHistory([]); // clear old friend history
          }

            setCurrentUser(user);

            //store in sessionStorage
            sessionStorage.setItem('username', user.username);
            sessionStorage.setItem('userId', user.userId);
        } catch (err) {
            console.log(err);
            setCurrentUser(null);
        }
    }
    fetchCurrentUser();
}, []);

  // // logic for removing searched User output 
  useEffect(()=>{
    if(searched.trim() == ""){
      setsearchResult({ username: '', userId: '' });
    } 
  },[searched]);


  // Add the previously searched friend to the friendHistory
  useEffect(()=>{
    if(searchResult?.username.trim()){
      if(searchResult.username == "Not found") return;
      const notAlreadyInHistory = friendHistory.every(
        f => f.username !== searchResult.username
      );
      if (notAlreadyInHistory) {
        setFriendHistory(prev => [...prev, searchResult]);
      }
      const savedHistory = JSON.stringify(friendHistory);
      sessionStorage.setItem('friend-history',savedHistory)

      // Can add logic to put it at top tho
      // after sending a msg
    }
  },[searchResult,friendHistory]);
  
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

  useEffect(()=>{
    if(rightContainerRef.current){
      rightContainerRef.current.scrollTop = rightContainerRef.current.scrollHeight;
    }
  },[chatHistory]);

  async function handleClick(e){
    e.preventDefault();

    if (!searched.trim()) {
      setsearchResult({ username: '', userId: '' });
      setChatHistory([]);
      return;
    }
  
    const res = await fetch(`http://localhost:3000/app/${searched}`,{
      method:"GET",
      headers:{
        "Content-Type":"application/json"
      },
      credentials: "include",  //  Ensure cookies are included in the request
    });
    if(!res.ok){
      setsearchResult({username:'Not found',userId:""})
      return;
    }
    const data = await res.json();
    setsearchResult
    ({username:data.username,userId:data.userId}); 
    setChatHistory([]);  // clear old chat history for new user
  }
  async function openChat(e){
    console.log("open chat runs")
    console.log(chatHistory)
    if(!searchResult.userId){
      console.log("not fetching bcz chatHistory is not empty or searchResult is empty")
      return;
    }
    const toFetch = searchResult.username;
    const res = await fetch(`http://localhost:3000/app/chat/${toFetch}`,{
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
    // console.log(typeof searchResult.userId);
    messages.map(msg => {
      console.log('Sender:', msg.sender, 'Returned User ID:', searchResult.userId);
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
      receiver:searchResult.userId,
      text:msg,
      createdAt,
      updatedAt
    }
    console.log("current user is ",currentUser.username);
    console.log("other user is ",searchResult.username);
    const chatId = [currentUser.username.trim(),searchResult.username.trim()].sort().join('_')
    socket.emit('send-msg',
      {userId:searchResult.userId,
        senderId:currentUser.userId,
        text:msg,
        chatId:chatId
      });
      //**Will Handle the image part later

      setChatHistory(prev=>[...prev,newMessage]);

      setMsg('')
  }

  useEffect(() => {
    if (searchResult.userId) {
      openChat(); 
    }
  }, [searchResult]);
  

  async function openFriendChat(e,friend) {
    // because you want the new ChatHistory
    if(searchResult.userId !== friend.userId){
      setChatHistory([]);
      setsearchResult(friend);
    }
  }

  return (
    <div className="container">
        <nav className='main-nav'>
          <div className='home'>Add Friends</div>
          <div className='user-profile'>{currentUser &&currentUser.username}</div>
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
              {
                friendHistory.map(friend=>{
                  return(
                    <div
                    key={friend.userId}
                    onClick={e=>openFriendChat(e,friend)}
                    className='friend'>
                    <img src="https://mrwallpaper.com/images/high/rain-world-game-scene-o7jp497z352uy4ot.webp" alt="" />
                    <li>{friend.username}</li>
                  </div>
                  )
                })
              }
            </ul>}
            {searched && 
              <ul className='friend-list'>
              { 
                searchResult.username=="Not found" &&
                <div className='friend'>
                  <div className='not-found'>
                    User not found
                  </div>
                </div>
              }  
              {searchResult.username && searchResult.username!="Not found" &&
              <div className='friend' onClick={openChat}>
                <img src="https://mrwallpaper.com/images/high/rain-world-game-scene-o7jp497z352uy4ot.webp" alt="" />
                <li>{searchResult.username}</li>
              </div>
              }
              </ul>
      
            }
          </div>
          <div className='right'>
            <div className='right-nav'>
              {searchResult.username ? <div className='user-name'>
                {searchResult.username}
              </div> :
              <div className='right-nav right-nav-empty'>
                
              </div>
              }
            </div>
            <div  className='right-container'
            ref={rightContainerRef}>
              { 
              searchResult.username &&
                chatHistory.map((msg,index)=>{
                  const isSentByCurrentUser = String(msg.sender) == String(currentUser?.userId);
                  console.log(isSentByCurrentUser);
                  console.log(msg.sender,currentUser)
                  return(
                        <div key={index} className={isSentByCurrentUser ? 'sender':'receiver'}>
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
            {searchResult.username &&
             searchResult.username != "Not found" &&
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
              </div>}
          </div>
        </main>
    </div>
  )
}

export default HomePage;