// Components
import VPicker from '../VPicker'
import VTime, { parseTime } from './VTime'
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

const rangeHours24 = createRange(24)
const rangeHours12am = createRange(12)
const rangeHours12pm = rangeHours12am.map(v => v + 12)
const range60 = createRange(60)
enum SelectingTimes {
  Hour = 1,
  Minute = 2,
  Second = 3
}
const selectingNames = { 1: 'hour', 2: 'minute', 3: 'second' }
export { SelectingTimes }

type Period = 'am' | 'pm'
type AllowFunction = (val: number) => boolean

export default Vue.extend({
  name: 'v-time-picker',

  props: {
    ...VPicker.options.props,
    ...Colorable.options.props,
    ...Themeable.options.props,
    ...VTime.options.props,
    readonly: Boolean,
    disabled: Boolean,
    scrollable: Boolean,
    useSeconds: Boolean,
    ampmInTitle: Boolean
  },

  data () {
    return {
      time: parseTime('00:00:00'),
      inputHour: null as number | null,
      inputMinute: null as number | null,
      inputSecond: null as number | null,
      lazyInputHour: null as number | null,
      lazyInputMinute: null as number | null,
      lazyInputSecond: null as number | null,
      period: 'am' as Period,
      selecting: SelectingTimes.Hour
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
    }
  },

  watch: {
    // value: 'setInputData'
  },

  mounted () {
    // this.setInputData(this.value)
    // this.$on('update:period', this.setPeriod)
  },

  methods: {
    // genValue () {
    //   if (this.inputHour != null && this.inputMinute != null && (!this.useSeconds || this.inputSecond != null)) {
    //     return `${pad(this.inputHour)}:${pad(this.inputMinute)}` + (this.useSeconds ? `:${pad(this.inputSecond!)}` : '')
    //   }

    //   return null
    // },
    // emitValue () {
    //   const value = this.genValue()
    //   if (value !== null) this.$emit('input', value)
    // },
    // setPeriod (period: Period) {
    //   this.period = period
    //   if (this.inputHour != null) {
    //     const newHour = this.inputHour! + (period === 'am' ? -12 : 12)
    //     this.inputHour = this.firstAllowed('hour', newHour)
    //     this.emitValue()
    //   }
    // },
    // setInputData (value: string | null | Date) {
    //   if (value == null || value === '') {
    //     this.inputHour = null
    //     this.inputMinute = null
    //     this.inputSecond = null
    //   } else if (value instanceof Date) {
    //     this.inputHour = value.getHours()
    //     this.inputMinute = value.getMinutes()
    //     this.inputSecond = value.getSeconds()
    //   } else {
    //     const [, hour, minute, , second, period] = value.trim().toLowerCase().match(/^(\d+):(\d+)(:(\d+))?([ap]m)?$/) || new Array(6)

    //     this.inputHour = period ? this.convert12to24(parseInt(hour, 10), period as Period) : parseInt(hour, 10)
    //     this.inputMinute = parseInt(minute, 10)
    //     this.inputSecond = parseInt(second || 0, 10)
    //   }

    //   this.period = (this.inputHour == null || this.inputHour < 12) ? 'am' : 'pm'
    // },
    // onInput (value: number) {
    //   if (this.selecting === SelectingTimes.Hour) {
    //     this.inputHour = this.isAmPm ? this.convert12to24(value, this.period) : value
    //   } else if (this.selecting === SelectingTimes.Minute) {
    //     this.inputMinute = value
    //   } else {
    //     this.inputSecond = value
    //   }
    //   this.emitValue()
    // },
    // onChange (value: number) {
    //   this.$emit(`click:${selectingNames[this.selecting]}`, value)

    //   const emitChange = this.selecting === (this.useSeconds ? SelectingTimes.Second : SelectingTimes.Minute)

    //   if (this.selecting === SelectingTimes.Hour) {
    //     this.selecting = SelectingTimes.Minute
    //   } else if (this.useSeconds && this.selecting === SelectingTimes.Minute) {
    //     this.selecting = SelectingTimes.Second
    //   }

    //   if (this.inputHour === this.lazyInputHour &&
    //     this.inputMinute === this.lazyInputMinute &&
    //     (!this.useSeconds || this.inputSecond === this.lazyInputSecond)
    //   ) return

    //   const time = this.genValue()
    //   if (time === null) return

    //   this.lazyInputHour = this.inputHour
    //   this.lazyInputMinute = this.inputMinute
    //   this.useSeconds && (this.lazyInputSecond = this.inputSecond)

    //   emitChange && this.$emit('change', time)
    // },
    // firstAllowed (type: 'hour' | 'minute' | 'second', value: number) {
    //   const allowedFn = type === 'hour' ? this.isAllowedHourCb : (type === 'minute' ? this.isAllowedMinuteCb : this.isAllowedSecondCb)
    //   if (!allowedFn) return value

    //   // TODO: clean up
    //   const range = type === 'minute'
    //     ? range60
    //     : (type === 'second'
    //       ? range60
    //       : (this.isAmPm
    //         ? (value < 12
    //           ? rangeHours12am
    //           : rangeHours12pm)
    //         : rangeHours24))
    //   const first = range.find(v => allowedFn((v + value) % range.length + range[0]))
    //   return ((first || 0) + value) % range.length + range[0]
    // },
    genClock (v: any) {
      return this.$createElement(VTimePickerClock, {
        props: {
          allowedValues: v.allowedValues,
          color: this.color,
          dark: this.dark,
          disabled: this.disabled,
          isAmPm: v.isAmPm,
          light: this.light,
          readonly: this.readonly,
          scrollable: this.scrollable,
          showAmPm: !this.ampmInTitle && v.isAmPm,
          time: v.time,
          size: 290
        },
        on: {
          'update:time': (v: any) => console.log(v),
          'update:selectMode': (v: any) => console.log(v)
        }
      })
    },
    genTitle (v: any) {
      return this.$createElement(VTimePickerTitle, {
        props: {
          ampm: this.ampmInTitle && v.isAmPm,
          disabled: this.disabled,
          hour: this.inputHour,
          minute: this.inputMinute,
          second: this.inputSecond,
          period: this.period,
          readonly: this.readonly,
          useSeconds: v.useSeconds,
          selectMode: v.selectMode
        },
        on: {
          'update:selecting': (v: any) => console.log(v),
          'update:period': (v: any) => console.log(v)
        },
        slot: 'title'
      })
    },
    genPicker (v: any) {
      return this.$createElement(VPicker, {
        staticClass: 'v-picker--time'
      }, [
        this.genTitle(v),
        this.genClock(v)
      ])
    }
  },

  render (h): VNode {
    return h(VTime, {
      props: {
        allowedHours: this.allowedHours,
        allowedMinutes: this.allowedMinutes,
        allowedSeconds: this.allowedSeconds,
        format: this.format,
        min: this.min,
        max: this.max,
        value: this.value
      },
      scopedSlots: {
        default: (v: any) => this.genPicker(v)
      }
    })
  }
})
