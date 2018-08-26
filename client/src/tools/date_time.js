import moment from 'moment'

export function toHHMMSS(text) {
  if (!text || text === '' || text === ' ') {
    return '-'
  }
  var t = Math.round(parseInt(text, 10) / 1000)
  var hours   = Math.floor(t / 3600)
  var minutes = Math.floor((t - (hours * 3600)) / 60)
  var seconds = t - (hours * 3600) - (minutes * 60)
  if (minutes < 10) {minutes = '0'+minutes}
  if (seconds < 10) {seconds = '0'+seconds}
  if (hours) {
    return hours+':'+minutes+':'+seconds
  }
  else {
    return minutes+':'+seconds
  }
}

export function toDate(time) {
  //return new Date(time).toLocaleDateString()
  return moment(time).format('YYYY-MM-DD')
}

export function toTime(time) {
  //return new Date(time).toLocaleTimeString()
  return moment(time).format('hh:mm')
}

export function time_to_now(time_start) {
  let n_time_start = parseInt(time_start, 10)
  let n_duration   = time_start ? (new Date().getTime() - n_time_start) : 0
  if (n_duration === 0) {
    return ''
  }
  let s_duration = n_duration.toString()
  return s_duration
}

export function time_to_dir(time) {
  return moment(time).format('YYYY-MM-DD_hh-mm-ss_SSS')
}
