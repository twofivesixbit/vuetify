// Components
import VPicker from '../VPicker'
import VTimePickerTitle from './VTimePickerTitle'
import VTimePickerClock from './VTimePickerClock'

// Mixins
import Colorable from '../../mixins/colorable'
import Themeable from '../../mixins/themeable'

// Utils
import { createRange } from '../../util/helpers'
import pad from '../VDatePicker/util/pad'

// Types
import Vue, { VNode } from 'vue'
import { PropValidator } from 'vue/types/options'

const rangeHours24 = createRange(24)
const rangeHours12am = createRange(12)
const rangeHours12pm = rangeHours12am.map(v => v + 12)
const range60 = createRange(60)

enum SelectMode {
  Hour = 1,
  Minute = 2,
  Second = 3
}

const selectingNames = { 1: 'hour', 2: 'minute', 3: 'second' }
const getSelectModeName = (mode: SelectMode) => selectingNames[mode]

export { SelectMode, getSelectModeName }

export type Period = 'am' | 'pm'
export type AllowFunction = (val: number) => boolean

export interface Time {
  hour: number | null
  minute: number | null
  second: number | null
}

export function convert24to12 (hour: number) {
  return hour ? ((hour - 1) % 12 + 1) : 12
}

export function convert12to24 (hour: number, period: Period) {
  return hour % 12 + (period === 'pm' ? 12 : 0)
}

export function parseTime (value: string | null | Date): Time {
  let hour, minute, second

  if (value == null || value === '') {
    hour = null
    minute = null
    second = null
  } else if (value instanceof Date) {
    hour = value.getHours()
    minute = value.getMinutes()
    second = value.getSeconds()
  } else {
    const [, h, m, , s, p] = value.trim().toLowerCase().match(/^(\d+):(\d+)(:(\d+))?([ap]m)?$/) || new Array(6)

    hour = p ? convert12to24(parseInt(h, 10), p as Period) : parseInt(h, 10)
    minute = parseInt(m, 10)
    second = parseInt(s || 0, 10)
  }

  return {
    hour,
    minute,
    second
  } as Time
}

export default Vue.extend({
  name: 'v-time',

  props: {
    allowedHours: {
      type: [ Function, Array ]
    } as PropValidator<AllowFunction | number[]>,
    allowedMinutes: {
      type: [ Function, Array ]
    } as PropValidator<AllowFunction | number[]>,
    allowedSeconds: {
      type: [ Function, Array ]
    } as PropValidator<AllowFunction | number[]>,
    format: {
      type: String,
      default: 'ampm',
      validator (val) {
        return ['ampm', '24hr'].includes(val)
      }
    } as PropValidator<'ampm' | '24hr'>,
    min: String,
    max: String,
    value: null as any as PropValidator<any>
  },

  data () {
    return {
      inputHour: null as number | null,
      inputMinute: null as number | null,
      inputSecond: null as number | null,
      lazyInputHour: null as number | null,
      lazyInputMinute: null as number | null,
      lazyInputSecond: null as number | null,
      period: 'am' as Period,
      selectMode: SelectMode.Hour,
      time: parseTime(null)
    }
  },

  computed: {
    isAllowedHourCb (): AllowFunction {
      let cb: AllowFunction

      if (this.allowedHours instanceof Array) {
        cb = (val: number) => (this.allowedHours as number[]).includes(val)
      } else {
        cb = this.allowedHours
      }

      if (!this.min && !this.max) return cb

      const minHour = this.min ? Number(this.min.split(':')[0]) : 0
      const maxHour = this.max ? Number(this.max.split(':')[0]) : 23

      return (val: number) => {
        return val >= minHour * 1 &&
          val <= maxHour * 1 &&
          (!cb || cb(val))
      }
    },
    isAllowedMinuteCb (): AllowFunction {
      let cb: AllowFunction

      const isHourAllowed = !this.isAllowedHourCb || this.inputHour === null || this.isAllowedHourCb(this.inputHour)
      if (this.allowedMinutes instanceof Array) {
        cb = (val: number) => (this.allowedMinutes as number[]).includes(val)
      } else {
        cb = this.allowedMinutes
      }

      if (!this.min && !this.max) {
        return isHourAllowed ? cb : () => false
      }

      const [minHour, minMinute] = this.min ? this.min.split(':').map(Number) : [0, 0]
      const [maxHour, maxMinute] = this.max ? this.max.split(':').map(Number) : [23, 59]
      const minTime = minHour * 60 + minMinute * 1
      const maxTime = maxHour * 60 + maxMinute * 1

      return (val: number) => {
        const time = 60 * this.inputHour! + val
        return time >= minTime &&
          time <= maxTime &&
          isHourAllowed &&
          (!cb || cb(val))
      }
    },
    isAllowedSecondCb (): AllowFunction {
      let cb: AllowFunction

      const isHourAllowed = !this.isAllowedHourCb || this.inputHour === null || this.isAllowedHourCb(this.inputHour)
      const isMinuteAllowed = isHourAllowed &&
        (!this.isAllowedMinuteCb ||
          this.inputMinute === null ||
          this.isAllowedMinuteCb(this.inputMinute)
        )

      if (this.allowedSeconds instanceof Array) {
        cb = (val: number) => (this.allowedSeconds as number[]).includes(val)
      } else {
        cb = this.allowedSeconds
      }

      if (!this.min && !this.max) {
        return isMinuteAllowed ? cb : () => false
      }

      const [minHour, minMinute, minSecond] = this.min ? this.min.split(':').map(Number) : [0, 0, 0]
      const [maxHour, maxMinute, maxSecond] = this.max ? this.max.split(':').map(Number) : [23, 59, 59]
      const minTime = minHour * 3600 + minMinute * 60 + (minSecond || 0) * 1
      const maxTime = maxHour * 3600 + maxMinute * 60 + (maxSecond || 0) * 1

      return (val: number) => {
        const time = 3600 * this.inputHour! + 60 * this.inputMinute! + val
        return time >= minTime &&
          time <= maxTime &&
          isMinuteAllowed &&
          (!cb || cb(val))
      }
    },
    isAmPm (): boolean {
      return this.format === 'ampm'
    },
    scopedSlotProps (): any {
      return {
        allowedValues: {
          hour: this.isAllowedHourCb,
          minute: this.isAllowedMinuteCb,
          second: this.isAllowedSecondCb
        },
        format: this.format,
        isAmPm: this.isAmPm,
        time: this.time,
        period: this.period
      }
    }
  },

  watch: {
    value: 'setInputData'
  },

  mounted () {
    this.setInputData(this.value)
    // this.$on('update:period', this.setPeriod)
  },

  methods: {
    genValue () {
      if (this.inputHour != null && this.inputMinute != null && (!this.useSeconds || this.inputSecond != null)) {
        return `${pad(this.inputHour)}:${pad(this.inputMinute)}` + (this.useSeconds ? `:${pad(this.inputSecond!)}` : '')
      }

      return null
    },
    emitValue () {
      const value = this.genValue()
      if (value !== null) this.$emit('input', value)
    },
    setPeriod (period: Period) {
      this.period = period
      if (this.inputHour != null) {
        const newHour = this.inputHour! + (period === 'am' ? -12 : 12)
        this.inputHour = this.firstAllowed('hour', newHour)
        this.emitValue()
      }
    },
    setInputData (value: string | null | Date) {
      this.time = parseTime(value)
    },
    onInput (value: number) {
      if (this.selectMode === SelectMode.Hour) {
        this.inputHour = this.isAmPm ? convert12to24(value, this.period) : value
      } else if (this.selectMode === SelectMode.Minute) {
        this.inputMinute = value
      } else {
        this.inputSecond = value
      }
      this.emitValue()
    },
    onChange (value: number) {
      this.$emit(`click:${selectingNames[this.selectMode]}`, value)

      const emitChange = this.selectMode === (this.useSeconds ? SelectMode.Second : SelectMode.Minute)

      if (this.selectMode === SelectMode.Hour) {
        this.selectMode = SelectMode.Minute
      } else if (this.useSeconds && this.selectMode === SelectMode.Minute) {
        this.selectMode = SelectMode.Second
      }

      if (this.inputHour === this.lazyInputHour &&
        this.inputMinute === this.lazyInputMinute &&
        (!this.useSeconds || this.inputSecond === this.lazyInputSecond)
      ) return

      const time = this.genValue()
      if (time === null) return

      this.lazyInputHour = this.inputHour
      this.lazyInputMinute = this.inputMinute
      this.useSeconds && (this.lazyInputSecond = this.inputSecond)

      emitChange && this.$emit('change', time)
    },
    firstAllowed (type: 'hour' | 'minute' | 'second', value: number) {
      const allowedFn = type === 'hour' ? this.isAllowedHourCb : (type === 'minute' ? this.isAllowedMinuteCb : this.isAllowedSecondCb)
      if (!allowedFn) return value

      // TODO: clean up
      const range = type === 'minute'
        ? range60
        : (type === 'second'
          ? range60
          : (this.isAmPm
            ? (value < 12
              ? rangeHours12am
              : rangeHours12pm)
            : rangeHours24))
      const first = range.find(v => allowedFn((v + value) % range.length + range[0]))
      return ((first || 0) + value) % range.length + range[0]
    }
  },

  render (h): VNode {
    return this.$scopedSlots.default!(this.scopedSlotProps) as any
  }
})
