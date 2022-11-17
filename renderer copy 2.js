const { ipcRenderer } = require('electron')

let center = undefined
let rightCoord = undefined
let leftCoord = undefined
let movement = undefined
let lineSize = undefined
let movementInterval = undefined
// let time = undefined

const cursor = document.getElementById('cursor')
const line = document.getElementById('line')
const text = document.getElementById('text')

const sound = new Audio('beep.mp3')

/* 
Formula to get points of a circle
          _______________________
radius = √(x1 - x2)² + (y1 - y2)²
*/

const getRadius = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2))
const getY = (x1, y1, x2, radius) => Math.sqrt(Math.pow(radius, 2) - Math.pow(x1, 2) + (2 * x1 * x2) - Math.pow(x2, 2)) + y1

const distFromCenter = (x) =>  x - center.x
// const getX = (initial, dist, time) => {
//   const lerp = time % (dist * 4)

//   if (lerp > dist * 2) return lerp - dist + (initial - lerp)

//   return lerp + initial
// }

const setNewPosition = ({ x, y }) => {
  line.setAttribute('y1', y)
  line.setAttribute('x1', x)
  cursor.setAttribute('cx', x)
  cursor.setAttribute('cy', y)
  text.setAttribute('x', x)
  text.setAttribute('y', y)
}

const updateMovement = () => {
  if (movement.x === center.x) {
    sound.play()
  }
  
  if (movement.direction === 'left') {
    movement.x--
    
    if (movement.x === leftCoord.x) {
      movement.direction = 'right'
    }
  } else {
    movement.x++
    
    if (movement.x === rightCoord.x) {
      movement.direction = 'left'
    }
  }
  // const dist = distFromCenter(leftCoord.x)
  // movement.x = getX(leftCoord.x, Math.abs(dist), (Date.now() - time) / 5)
  // console.log('new X', movement.x)
  movement.y = getY(center.x, center.y, movement.x, lineSize)
}

const moveBall = () => {
  // time = Date.now()
  // console.log('leftCoord', leftCoord)
  // console.log('center', center)
  // console.log('distFromCenter', distFromCenter(leftCoord.x))
  movementInterval = setInterval(() => {      
    updateMovement()
    setNewPosition({ x: movement.x, y: movement.y })
  }, 1)
}

const cursorClick = (event) => {
  const dist = distFromCenter(event.x)
  const startOnRight = dist > 0

  if (startOnRight) {
    rightCoord = { x: event.x, y: event.y }
    leftCoord = { y: event.y, x:center.x - dist }
    movement = { x: event.x, y: event.y, direction: 'left' }
  } else {
    leftCoord = { x: event.x, y: event.y }
    rightCoord = { y: event.y, x: center.x - dist }
    movement = { x: event.x, y: event.y, direction: 'right' }
  }

  document.removeEventListener('mousemove', handleMousemove)
  moveBall()

  ipcRenderer.send('start')
}

const handleMousemove = (event) => {
  setNewPosition({ x: event.x, y: event.y })
  lineSize = getRadius(center.x, center.y, event.x, event.y)

  const dist = distFromCenter(event.x)
  const beatsPerSecond = dist / 100
  text.textContent = Math.abs(beatsPerSecond)
}

ipcRenderer.on('configure', (_event, { x, y }) => {
  center = { x: x + 16, y }

  line.setAttribute('y2', center.y)
  line.setAttribute('x2', center.x)

  cursor.addEventListener('click', cursorClick)
  document.addEventListener('mousemove', handleMousemove)
})

ipcRenderer.on('stop', (_event) => {
  if (movementInterval) {
    clearInterval(movementInterval)
  }

  cursor.removeEventListener('click', cursorClick)
  document.removeEventListener('mousemove', handleMousemove)

  line.setAttribute('y2', -100)
  line.setAttribute('x2', -100)
  line.setAttribute('y1', -100)
  line.setAttribute('x1', -100)
  cursor.setAttribute('cx', -100)
  cursor.setAttribute('cy', -100)
  text.setAttribute('x', -100)
  text.setAttribute('y', -100)
})

