const express = require('express')
const http = require('http')
const socket = require('socket.io')
const { generateMsg, generateLoc } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

const app = express()
//create server 
const server = http.createServer(app)


//now server support web socket
const io = socket(server)


//loading public files
app.use(express.static('./public'))


io.on('connection',(stream)=>{

    console.log('new web socket connection')
    
    stream.on('join',(options,cb)=>{
        const {error,user} = addUser({ id: stream.id ,...options })

        if(error){
            return cb(error)
        }

        stream.join(user.room)

        stream.emit('message', generateMsg('admin','welcome'))
        stream.broadcast.to(user.room).emit('message',generateMsg(`${user.username} has joined`))
        io.to(user.room).emit('roomdata',{
            room: user.room,
            users: getUserInRoom(user.room)
        })
        cb()
        //stream.emit, io.emit, stream.broadcast.emit
        //io.to.emit, stream.broadcast.to.emit

    })
    
    stream.on('sendmsg',(msg,cb)=>{
        const user = getUser(stream.id)
        io.to(user.room).emit('message',generateMsg(user.username,msg))
        cb('delivered')
    })

    stream.on('sendLoc',(coords, cb)=>{
        const user = getUser(stream.id)
        io.to(user.room).emit('location_msg', generateLoc(user.username ,`https://google.com/maps?q=${coords.lat},${coords.long}`) )
        cb()
    })

    stream.on('disconnect',()=>{
        const user = removeUser(stream.id)

        if(user){
            io.to(user.room).emit('message',generateMsg(`${user.username} has left`))
            io.to(user.room).emit('roomdata',{
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }

    })
   
})

const port = process.env.PORT || 8000
//running server on port
server.listen(port, ()=>console.log(`listening at ${port}`))