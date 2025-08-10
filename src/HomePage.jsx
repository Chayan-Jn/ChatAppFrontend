import { useEffect, useState } from 'react'
import './HomePage.css'
const HomePage = () => {
  const [searched,setSearched] = useState('');
  const [returnedUser,setReturnedUser] = useState('')
  const [chatHistory,setChatHistory] = useState([]);

  useEffect(()=>{
    if(searched == "") setReturnedUser("");
  },[searched]);
  
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
                <img src="" alt="" />
                <li>b</li>
              </div>
              <div className='friend'>
                <img src="" alt="" />
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
          </div>
        </main>
    </div>
  )
}

export default HomePage