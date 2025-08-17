import { useEffect, useRef, useState } from 'react'
import './HomePage.css'
import socket  from './socket';
import { BiSolidSend } from "react-icons/bi";
import { FaRegImages } from "react-icons/fa";

const HomePage = () => {
  const [searched,setSearched] = useState('');
  const [searchResult,setsearchResult] = useState({ username: '', userId: '' }); //{username,userId}
  const [chatHistory,setChatHistory] = useState([]);
  const [currentUser,setCurrentUser] = useState(null);
  const [msg,setMsg] = useState('')
  const rightContainerRef = useRef(null);
  const [friendHistory,setFriendHistory] = useState(JSON.parse(sessionStorage.getItem('friend-history')) || []); 
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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
            const res = await fetch('/app/get-current-user', {
                credentials: 'include'
            });
            if (!res.ok) return;

            const data = await res.json();
            const user = data.data; // {username, userId}

            // If user changes clear friendHistory
            const previousUserId = sessionStorage.getItem('userId');
            if(previousUserId && previousUserId !== user.userId){
              setFriendHistory([]);
            }

            setCurrentUser(user);
          // if (!currentUser || currentUser.userId !== user.userId) {
          //   setFriendHistory([]); 
          // }
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
      // Can add logic to put it at top tho
      // after sending a msg
    }
  },[searchResult]);

  useEffect(()=>{
    sessionStorage.setItem('friend-history',JSON.stringify(friendHistory));
  },[friendHistory]);
  
  const handleReceivedMsg = (receivedData)=>{
    if (!currentUser) return;
    if(receivedData.sender !== currentUser?.userId){
      // Only add messages that belong to the currently open chat
      const chatId = [currentUser.username.trim(), searchResult.username.trim()].sort().join('_');

      if (receivedData.chatId === chatId) {
        setChatHistory(prev => [...prev, receivedData]);
      }
    }

  }
  useEffect(()=>{
    if(!currentUser) return;
    try{
      socket.emit('loginUser',(currentUser.userId));
      socket.on('receive-msg', handleReceivedMsg)
    }
    catch(err){
      console.log(err)
    }

    return ()=>{
      socket.off('receive-msg',handleReceivedMsg);
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
  
    const res = await fetch(`/app/${searched}`,{
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
    const res = await fetch(`/app/chat/${toFetch}`,{
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
  
    // Send text
    if (msg.trim()) {
      const now = new Date();
      const chatId = [currentUser.username.trim(), searchResult.username.trim()].sort().join('_');
      const newMessage = {
        sender: currentUser.userId,
        receiver: searchResult.userId,
        text: msg,
        imageUrl: null,
        chatId
      };
  
      setChatHistory(prev => [...prev, newMessage]);
  
      socket.emit('send-msg', {
        sender: currentUser.userId,
        receiver: searchResult.userId,
        text: msg,
        imageUrl: null,
        chatId
      });

  
      setMsg('');
    }
  
    // Send image, if thre is any
    if (selectedImage) {
      const imageToSend = selectedImage;
      setSelectedImage(null);
      setPreviewUrl(null);
      await handleImgUpload(imageToSend);
    }
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file)); //to preview before sending
  };

  async function handleImgUpload(file) {

    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`/app/images/${searchResult.username}`,{
      method:"POST",
      body:formData,
      credentials:'include'
    });
    if(!res.ok){
      console.log('error sending Image')
      return;
    }
    const data = await res.json();
    const msgData = data.msgData;
    const newMessage = {
      sender:currentUser.userId,
      receiver:searchResult.userId,
      text:'',
      imageUrl:msgData.imageUrl,
      chatId:msgData.chatId,
    }
    setChatHistory((prev) => [...prev, newMessage]);
    socket.emit('send-msg',newMessage);
      setSelectedImage(null);
      setPreviewUrl(null);
  }

  const closeImage = ()=>{
    setSelectedImage(null);
    setPreviewUrl(null);
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
                <div className='other-user-name'>{searchResult.username}</div>
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
                  <label htmlFor="image-file" className='upload-image'>
                    {!previewUrl && <span><FaRegImages className='gallery' /></span>}
                  </label>
                  {previewUrl && (
                    <div className="preview">
                      <img src={previewUrl} alt="preview" style={{ maxHeight: '100px' }} />
                      <div onClick ={closeImage} className='remove-img'>X</div>
                    </div>
                  )}
                  <input type='file' id='image-file' 
                  accept='image/*'
                  onChange={handleImageSelect} />
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