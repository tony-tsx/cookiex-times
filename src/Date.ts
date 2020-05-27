class Date extends global.Date {
  protected static CHARACTERS =
    [ 'd', 'j', 'D', 'l', 'S', 'z', 'F', 'M', 'm', 'n', 'Y', 'y', 'a', 'A', 'g', 'h', 'G', 'H', 'i', 's', 'u', 'e', 'O', 'P', 'T', 'U' ] as const

  protected static DAYS_Of_WEEK =
    [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', ] as const

  protected static DAYS_Of_WEEK_SHORT =
    [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', ] as const

  protected static MONTHS =
    [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ] as const

  protected static MONTHS_SHORT =
    [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ] as const

  protected static DEFAULT_FORMAT = 'default'

  private static formatters: { [key: string]: string } = {}

  private static createGMT = ( date: globalThis.Date ) => {
    const [ , h, m ] = ( date.getTimezoneOffset() / 60 ).toFixed( 2 ).match( /(-?[0-9]{1,2}).([0-9]{2})/ )
    const hour = parseInt( h )
    const minute = parseInt( m )
    const mmin = `00${minute * 60 / 100}`.slice( -2 )
    if ( hour > 0 ) return `GMT-${hour}:${mmin}`
    return  `GMT+${hour * -1}:${mmin}`
  }

  public eject = () => new global.Date( this )
  public static registerFormatter = ( name: string, format: string ) => Date.formatters[name] = format
  public static from = ( format: string, date: string ) => {
    const description: {
      date?: string
      day?: string
      hours?: string
      minutes?: string
      days?: string
      month?: string
      year?: string
      dayPeriod?: 'am' | 'pm' | 'AM' | 'PM'
      seconds?: string
      ms?: string
      gmt?: string
      time?: string
    } = {}
    const current = new global.Date()
    type Mapper = { type: keyof typeof description, regexp: RegExp, char: Date.CHARACTERS } | string
    format.split( '' ).map<Mapper>( ( char: Date.CHARACTERS ) => {
      if ( Date.CHARACTERS.includes( char ) )
        switch ( char ) {
          case 'd': return { type: 'date', regexp: /^([0-9]{2})/, char }
          case 'j': return { type: 'date', regexp: /^([0-9]{1,2})/, char }
          case 'D': return { type: 'day', regexp: RegExp( `^(${Date.DAYS_Of_WEEK_SHORT.join( '|' )})` ), char }
          case 'l': return { type: 'day', regexp: RegExp( `^(${Date.DAYS_Of_WEEK.join( '|' )})` ), char }
          case 'S': throw new Error()
          case 'z': return { type: 'days', regexp: /^([0-9]{1,3})/, char }
          case 'F': return { type: 'month', regexp: RegExp( `^(${Date.MONTHS.join( '|' )})` ), char }
          case 'M': return { type: 'month', regexp: RegExp( `^(${Date.MONTHS_SHORT.join( '|' )})` ), char }
          case 'm': return { type: 'month', regexp: /^([0-9]){2}/, char }
          case 'n': return { type: 'month', regexp: /^([0-9]){1,2}/, char }
          case 'Y': return { type: 'year', regexp: /^([0-9]{4})/, char }
          case 'y': return { type: 'year', regexp: /^([0-9]{2})/, char }
          case 'a':
          case 'A': return { type: 'dayPeriod', regexp: /^([ap]m)/i, char }
          case 'g': return { type: 'hours', regexp: /^([0-9]{1,2})/, char }
          case 'h': return { type: 'hours', regexp: /^([0-9]{2})/, char }
          case 'G': return { type: 'hours', regexp: /^([0-9]{1,2})/, char }
          case 'H': return { type: 'hours', regexp: /^([0-9]{2})/, char }
          case 'i': return { type: 'minutes', regexp: /^([0-9]{2})/, char }
          case 's': return { type: 'seconds', regexp: /^([0-9]{2})/, char }
          case 'u': return { type: 'ms', regexp: /^([0-9]{1,6})/, char }
          case 'e':
          case 'O':
          case 'P': throw new Error()
          case 'T': return { type: 'gmt', regexp: /^GMT([+-][0-9]{1,2}:?[0-9]{0,2})/, char }
          case 'U': return { type: 'time', regexp: /^([0-9]+)/, char }
          default: throw new Error( `char: ${char} is not valid in char expression` )
        }
      return char as string
    } ).reduce<string>( ( date, rule ) => {
      if ( typeof rule === 'string' ) return date.replace( rule, '' )
      const matches = rule.regexp.exec( date )
      if ( !matches ) throw new Error( `not matches for ${rule.regexp} using alloc ( ${rule.type} ) for date ${ date }` )
      const first = matches[0]
      if ( !first ) throw new Error( '' )
      description[rule.type] = first as any
      return date.replace( first, '' )
    }, date.toString().trim() )

    if ( description.dayPeriod ) {
      if ( !description.hours )
        if ( description.dayPeriod.toLowerCase() === 'pm' )
          description.hours = '13'
        else description.hours = '00'
      else {
        const hours = parseInt( description.hours, 10 )
        if ( isNaN( hours ) ) throw new Error()
        if ( hours > 12 ) throw new Error()
        if ( description.dayPeriod.toLowerCase() === 'pm' )
          description.hours = `${hours + 12}`
      }
      delete description.dayPeriod
    }
    if ( description.month && isNaN( parseInt( description.month, 10 ) ) ) {

      let index: number | string = description.month
    
      if ( Date.MONTHS_SHORT.includes( description.month as any ) )
        index = Date.MONTHS_SHORT.indexOf( description.month as any )

      if ( Date.MONTHS.includes( description.month as any ) )
        index = Date.MONTHS.indexOf( description.month as any )

      index = parseInt( index.toString(), 10 )

      if ( isNaN( index ) ) throw new Error()

      description.month = `0${Math.min( index + 1, 12 )}`.slice( -2 )
    }

    if ( description.days )
      if ( !description.year ) description.year = current.getFullYear().toString()
      else if ( description.date ) throw new Error( 'days not process using date with reference' )
      else if ( description.month ) throw new Error( 'days not process using month with reference' )
      else if ( description.day ) throw new Error( 'days not process using day with reference' )
      else {
        const utc = Date.UTC( parseInt( description.year, 10 ), 0, 1, 0, 0, 0, 0 )
        const days = parseInt( description.days )
        if ( isNaN( days ) ) throw new Error( 'days is nan' )
        const next = days * 24 * 60 * 60 * 1000
        const date = new global.Date( utc + next )
        description.date = `0${date.getDate() + 1}`.slice( -2 )
        description.month = `0${date.getMonth() + 1}`.slice( -2 )
        delete description.days
      }

    if ( !description.year ) description.year = current.getFullYear().toString()
    if ( !description.month ) description.month = `0${current.getMonth() + 1}`.slice( -2 )
    if ( !description.date ) description.date = `0${current.getDate() + 1}`.slice( -2 )

    if ( !description.hours ) description.hours = '00'
    if ( !description.minutes ) description.minutes = '00'
    if ( !description.hours ) description.hours = '00'
    if ( !description.seconds ) description.seconds = '00'
    if ( !description.ms ) description.ms = '000000'

    let gmt = Date.createGMT( current )

    if ( description.gmt ) gmt = description.gmt
    const datestr = `${description.year}-${description.month}-${description.date} ${description.hours}:${description.minutes}:${description.seconds}.${description.ms} ${gmt}`
    return new Date( datestr )
  }
  public format = ( format: string ) => format.split( '' ).map<string|number>( ( char: Date.CHARACTERS, i, chars ) => {
    if ( i > 0 && chars[i-1] === '\\' ) return char
    if ( char as string === '\\' ) return ''
    if ( Date.CHARACTERS.includes( char ) )
      switch ( char ) {
        case 'd': return `0${this.getDate()}`.slice( -2 )
        case 'j': return this.getDate()
        case 'D': return Date.DAYS_Of_WEEK_SHORT[this.getDay()]
        case 'l': return Date.DAYS_Of_WEEK[this.getDay()]
        case 'S':
          switch ( this.getDate() ) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
          }
        case 'z': {
          const initial = Date.UTC( this.getFullYear(), 0, 1 )
          const difference = this.getTime() - initial
          return ( difference / 100 / 60 / 60 / 24 ).toFixed()
        }
        case 'F': return Date.MONTHS[this.getMonth()]
        case 'M': return Date.MONTHS_SHORT[this.getMonth()]
        case 'm': return `0${this.getMonth() + 1}`.slice( -2 )
        case 'n': return this.getMonth()
        case 'Y': return this.getFullYear()
        case 'y': return this.getFullYear().toString().slice( -2 )
        case 'a': return this.getHours() > 12 ? 'pm' : 'am'
        case 'A': return this.getHours() > 12 ? 'PM' : 'AM'
        case 'g': return this.getHours() < 12 ? this.getHours() : this.getHours() - 12
        case 'h': return this.getHours() < 12 ? this.getHours().toString().slice( -2 ) : ( this.getHours() - 12 ).toString().slice( -2 )
        case 'G': return this.getHours()
        case 'H': return `0${this.getHours()}`.slice( -2 )
        case 'i': return `0${this.getMinutes()}`.slice( -2 )
        case 's': return `0${this.getSeconds()}`.slice( -2 )
        case 'u': return `000000${this.getMilliseconds()}`.slice( -6 )
        case 'e':
        case 'O':
        case 'P': throw new Error()
        case 'T': return Date.createGMT( this )
        case 'U': return this.getTime()
        default: throw new Error( `char: ${char} is not valid in char expression` )
      }
    return char as string
  } ).join( '' )

  public toString = ( format = Date.DEFAULT_FORMAT ) => {
    if ( !format || format === 'default' || !Date.formatters[format] ) return super.toString()
    return this.format( Date.formatters[format] )
  }
}

namespace Date {
  export type CHARACTERS = 'd' | 'j' | 'D' | 'l' | 'S' | 'z' | 'F' | 'M' | 'm' | 'n' | 'Y' | 'y' | 'a' | 'A' | 'g' | 'h' | 'G' | 'H' | 'i' | 's' | 'u' | 'e' | 'O' | 'P' | 'T' | 'U'
}

export default Date
