// eslint-disable-next-line no-undef
dv = this.dv


// # TIMES

const today = dv.date('today')
const oneMonthAgo = today.minus(dv.duration('1mo'))
const future = today.plus(dv.duration('3mo'))


// # FUNCTIONS

const getDue = file => {
	const { done, due, repeat } = file
	if (done && !repeat) return null
	else if(due) return due
	else if (!done && repeat) return today
	else if (done && repeat) return dv.date(done).plus(dv.duration(repeat))
	else return null
}

const prioIcon = prio => ({
	A: '📌',
	B: '🔴',
	C: '🟡',
	D: '🔵',
	F: '',
}[prio])

const iconizePrio = task => ({
	...task, prio: prioIcon(task.prio) ?? 'INVALID'
})

const timeIcon = time => ({
	A: '🐔', // 08-12
	B: '🌞', // 12-17
	H: '⛅', // 17-18
	X: '🌙', // 21-00
	Z: '💤', // 00-08
	_: ''
}[time])

const iconizeTime = task => ({
	...task, time: timeIcon(task.time) ?? 'INVALID'
})


// # QUERIES

const dailyNotes = dv.pages('"Documents/Daily"')
const cards = dv.pages('"Cards"')

const quickTasks = dailyNotes
	.map(x => ({
		tasks: x.file.tasks,
		cday: dv.date(`20${x.file.name}`)
	}))
	.filter(x => x.cday > oneMonthAgo)
	.tasks
	.filter(x => !x.completed)
;


const tasks = cards
	.map(x => ({
		cday: x.file.cday,
		due: getDue(x),
		time: x.time ?? '_',
		done: x.done,
		flows: x.flows,
		prio: x.prio ?? 'F',
		link: x.file.link,
	}))
	.sort(x => x.due)
;

const completed = tasks
	.filter(x => x.done && x.done >= today)
	.sort(x => x.link)
;

const dueTasks = tasks.filter(x => x.due)

const dueToday = dueTasks
	.filter(x => x.due <= today)
	.sort(x => x.prio + x.due.toString() + x.time)
	.map(x => iconizePrio(x))
	.map(x => iconizeTime(x))
	.map(x => ({ ...x, time: `${x.due.day} ${x.time}` }))
;

const dueWhenever = dueTasks
	.filter(x => x.due > today && x.due < future)
	.map(x => iconizePrio(x))
	.sort(x => x.prio + x.due.toString())
;


const pinnedCards = cards
	.filter(card => card.flows
		.map(flow => flow.path)
		.some(path => path?.includes('Pinned'))
	)
	.map(x => x.file.link)
;


// # RENDERING

dv.header(1, today)

dv.header(1, pinnedCards.join(' | '))

dv.header(2, 'Due Today')

dv.table(['Task', 'Prio', 'Time'],
	dueToday.map(x => [x.link, x.prio, x.time])
)

dv.header(3, 'Completed Today')

dv.list(completed.map(x => [x.link]))

dv.header(3, 'Quick Tasks')

dv.taskList(quickTasks)

dv.header(3, 'Scheduled')

dv.table(['Task', 'Prio', 'Due'],
	dueWhenever.map(x => [x.link, x.prio, x.due])
)