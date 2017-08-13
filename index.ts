class Task {
    begin = 0
    load = 0
    duration = 0
}

class Machine {
    tasks = [ ] as Task[]
    capability = 0
    getLoadAtTime(time: number) {
        return this.tasks
            .filter(task => task.begin <= time && time < task.begin + task.duration)
            .reduce((sum, task) => task.load + sum, 0)
    }
    getNextTick(time: number) {
        return this.tasks
            .filter(task => task.begin <= time && time < task.begin + task.duration)
            .reduce((tick, task) => Math.min(tick, task.begin + task.duration), 1/0)
    }
}

function rand(begin: number, end: number) {
    return Math.floor(Math.random() * (end - begin)) + begin
}

const MACHINE_COUNT = 10,
    TASK_COUNT = 100

const machines = Array(MACHINE_COUNT).fill(0).map(() => Object.assign(new Machine(), {
    capability: rand(1, 3),
}))

const tasks = Array(TASK_COUNT).fill(0).map(() => Object.assign(new Task(), {
    begin: -1,
    load: rand(2, 5) / 10,
    duration: rand(5, 10) * 10,
}))

const cv = document.createElement('canvas')
document.body.appendChild(cv)
document.body.style.overflow = 'hidden'
document.body.style.padding = document.body.style.margin = '0'
function update() {    
    cv.width = window.innerWidth
    cv.height = window.innerHeight
    const dc = cv.getContext('2d')
    if (dc) {
        dc.clearRect(0, 0, cv.width, cv.height)
        dc.font = '20px Arial'
        dc.fillText(`time: ${tick}, tasks left: ${tasks.length}`, 10, cv.height - 10)

        const maxT = machines
                .reduce((arr, { tasks }) => arr.concat(tasks), [ ] as Task[])
                .reduce((max, task) => Math.max(max, task.begin + task.duration), -1/0),
            sx = cv.width / maxT,
            sy = cv.height / machines.length
        
        dc.beginPath()
        dc.moveTo(tick * sx, 0)
        dc.lineTo(tick * sx, cv.height)
        dc.strokeStyle = 'red'
        dc.stroke()
        dc.closePath()

        const tickSet = new Set<number>()
        machines.forEach((machine, index) => {
            machine.tasks.forEach(task => {
                tickSet.add(task.begin)
                tickSet.add(task.begin + task.duration)
            })
        })

        const ticks = Array.from(tickSet).sort((a, b) => a - b)
        machines.forEach((machine, index) => {
            dc.beginPath()
            dc.moveTo(0, index * sy)
            dc.lineTo(cv.width, index * sy)
            dc.closePath()
            dc.strokeStyle = 'blue'
            dc.stroke()

            dc.beginPath()
            dc.moveTo(0, sy * (index + 1))
            ticks.forEach((t, j) => {
                const load = machine.getLoadAtTime(t),
                    tick = ticks[j + 1] || t
                dc.lineTo(sx * t,    sy * (index + 1 - load / machine.capability))
                dc.lineTo(sx * tick, sy * (index + 1 - load / machine.capability))
            })
            dc.closePath()
            dc.strokeStyle = 'black'
            dc.stroke()
            dc.fillStyle = 'rgba(0, 0, 255, 0.1)'
            dc.fill()

            const colors = [
                'rgba(255, 0, 0,   0.1)',
                'rgba(0, 255, 0,   0.1)',
                'rgba(0, 0, 255,   0.1)',
                'rgba(255, 255, 0, 0.1)',
                'rgba(0, 255, 255, 0.1)',
                'rgba(255, 0, 255, 0.1)',
            ]
            const loadSum = machine.tasks.reduce((sum, task) => sum + task.load, 0)
            let load = 0
            machine.tasks.forEach((task, j) => {
                dc.fillStyle = colors[j % colors.length]
                dc.fillRect(task.begin * sx, index * sy + load / loadSum * sy,
                    task.duration * sx, task.load / loadSum * sy)
                load += task.load
            })
        })
    }
}

let tick = 0
function schedule() {
    for (let i = 0; i < 5 && i < tasks.length; i ++) {
        const task = tasks[i]
        const availMachines = machines
            .map(machine => ({ load: machine.getLoadAtTime(tick), machine }))
            .filter(({ load, machine }) => load + task.load < machine.capability)
            .sort((a, b) => a.load - b.load)
            .sort((a, b) => a.machine.tasks.length - b.machine.tasks.length)
            .map(({ machine }) => machine)
        const machine = availMachines[0]
        if (machine) {
            tasks.splice(i, 1)
            task.begin = tick
            machine.tasks.push(task)
            console.log(`${tasks.length} left`)
            break
        }
    }
    const nextTick = machines
        .map(machine => machine.getNextTick(tick))
        .reduce((min, tick) => Math.min(min, tick), 1/0)
    if (nextTick < 1 / 0) {
        tick = Math.min(tick + 1, nextTick)
        update()
        setTimeout(schedule, 1000)
    }
}

schedule()