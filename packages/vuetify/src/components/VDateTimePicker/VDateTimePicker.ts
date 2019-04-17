// Styles
import './VDateTimePicker.sass'

// Types
import Vue, { VNode } from 'vue'

// Components
import VPicker from '../VPicker'
import { VTabs, VTab } from '../VTabs'

// Mixins
import { VDatePickerTitle } from '../VDatePicker'
import { VTimePickerTitle, VTimePickerClock } from '../VTimePicker'

export default Vue.extend({
  name: 'v-date-time-picker',

  props: {
    ...VPicker.options.props
  },

  data: () => ({
    mode: 'time',
    date: '2019-04-01'
  }),

  methods: {
    genTabs () {
      const tabs = [
        { text: 'Date' },
        { text: 'Time' }
      ].map(tab => this.$createElement(VTab, {

      }, [tab.text]))

      return this.$createElement(VTabs, {
        props: {
          fixedTabs: true,
          dark: true
        }
      }, tabs)
    },
    genHeaders () {
      return this.$createElement('div', {
        staticClass: 'v-date-time-picker__headers'
      }, [
        this.$createElement(VDatePickerTitle, {
          props: {
            date: 'Apr 17'
          }
        }),
        this.$createElement(VTimePickerTitle)
      ])
    },
    genDatePicker () {
      return this.$createElement('div')
    },
    genTimePicker () {
      return this.$createElement(VTimePickerClock, {
        props: {
          min: 0,
          max: 12
        }
      })
    },
    genBody () {
      if (this.mode === 'time') {
        return this.genTimePicker()
      } else {
        return this.genDatePicker()
      }
    }
  },

  render (h): VNode {
    return h(VPicker, {
      staticClass: 'v-date-time-picker',
      props: this.$props
    }, [
      h('template', { slot: 'title' }, [
        this.genHeaders(),
        this.genTabs()
      ]),
      this.genBody()
    ])
  }
})
