import TimesDate from './Date'

export { default as Date } from './Date'

namespace Times {
  export import Date = TimesDate // eslint-disable-line
}

export default Times
