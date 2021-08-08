const stream = io()

//elements
const $messageForm = document.getElementById('msg_form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')

const $locBtn = document.getElementById('location')

const $msg_ui = document.getElementById('msg_ui')
//templates
const $msg_temp = document.getElementById('msg_temp').innerHTML
const $locaton_msg_temp = document.getElementById('location_msg_temp').innerHTML
const sidebarTemp = document.querySelector('#sidebar_temp').innerHTML
//options
const { username , room } = Qs.parse(location.search,{ ignoreQueryPrefix:true })

const autoscroll = ()=>{
    // new msg element
    const $newMsg = $msg_ui.lastElementChild

    //Height of the new msg
    const newMsgStyle = getComputedStyle($newMsg)
    const newMsgMargin = parseInt(newMsgStyle.marginBottom)
    const newMsgHei = $newMsg.offsetHeight+newMsgMargin
    //visible height
    const visibleHei = $msg_ui.offsetHeight
    //height msg container
    const constainerHei = $msg_ui.scrollHeight
    //how far have i scroll
    const scrollOff = $msg_ui.scrollTop+visibleHei
    if(constainerHei-newMsgHei <= scrollOff){
        $msg_ui.scrollTop = $msg_ui.scrollHeight
    }
}

stream.on('message',(msg)=>{
    console.log(msg)
    const html = Mustache.render($msg_temp,{
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $msg_ui.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

stream.on('location_msg',(loc)=>{
    console.log(loc)
    const html = Mustache.render($locaton_msg_temp,{
        username: loc.username,
        url:loc.url,
        createdAt: moment(loc.createdAt).format('h:mm a')
    })
    $msg_ui.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

stream.on('roomdata',({room, users})=>{
    const html = Mustache.render(sidebarTemp,{
        room,
        users
    })
    document.getElementById('sidebar').innerHTML=html
    
})

$messageForm.addEventListener('submit',(e)=>{
    
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled','disabled')


    const message = e.target.elements.msg.value
    stream.emit('sendmsg',message, (delivered)=>{
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        console.log('the message was delivered: ', delivered)
    })
    
})


$locBtn.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('location not supported')
    }
    $locBtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((pos)=>{
      //  console.log(pos.coords.latitude)
       stream.emit('sendLoc',{
           lat:pos.coords.latitude,
           long:pos.coords.longitude},
           ()=>{
               console.log('location shared')
               $locBtn.removeAttribute('disabled')
        })
    })
})

stream.emit('join',{ username, room }, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})