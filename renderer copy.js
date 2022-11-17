const { ipcRenderer } = require('electron')

let center = undefined
let lineSize = undefined // size of the line from the ball to the tray
let xAxisSpan = undefined // width the thing will thing from most left to most right
let movementInterval = undefined
let time = undefined

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

const getX = (initial, dist, time) => {
  const lerp = time % (dist * 2)
  return dist - Math.abs(dist - lerp) + initial
}

const setNewPosition = ({ x, y }) => {
  line.setAttribute('y1', y)
  line.setAttribute('x1', x)
  cursor.setAttribute('cx', x)
  cursor.setAttribute('cy', y)
  text.setAttribute('x', x)
  text.setAttribute('y', y)
}

const moveBall = () => {
  time = Date.now()
  movementInterval = setInterval(() => {      
    const x = getX(center.x - xAxisSpan / 2, xAxisSpan, (Date.now() - time) / 5)
    const y = getY(center.x, center.y, x, lineSize)  
    setNewPosition({ x, y })
  }, 1)
}

const cursorClick = (event) => {
  document.removeEventListener('mousemove', handleMousemove)
  moveBall()

  ipcRenderer.send('start')
}

const handleMousemove = (event) => {
  setNewPosition({ x: event.x, y: event.y })
  lineSize = getRadius(center.x, center.y, event.x, event.y)
  xAxisSpan = Math.abs(event.x - center.x) * 2

  const beatsPerSecond = xAxisSpan
  text.textContent = `${Math.abs(beatsPerSecond)} bps`
}

ipcRenderer.on('configure', (_event, { x, y }) => {
  center = { x: x + 16, y }

  line.setAttribute('y2', center.y - 5) // just a bit offset to top
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

  setNewPosition({ x: -100, y: -100 })
})
