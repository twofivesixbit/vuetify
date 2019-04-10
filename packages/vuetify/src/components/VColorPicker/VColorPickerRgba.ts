// Types
import Vue, { VNode } from 'vue'
import { PropValidator } from 'vue/types/options'
import { RGBA } from '../../util/colorUtils'
import { deepEqual } from '../../util/helpers'

export default Vue.extend({
  name: 'v-color-picker-rgba',

  props: {
    value: Array as PropValidator<RGBA>
  },

  data: () => ({
    rgba: [0, 0, 0, 0] as RGBA
  }),

  watch: {
    value: {
      handler (v: RGBA) {
        if (deepEqual(v, this.rgba)) return
        this.rgba = v
      },
      deep: true
    },
    rgba: {
      handler (v: RGBA) {
        this.$emit('input', v)
      },
      deep: true
    }
  },

  methods: {
    updateValue (e: Event, index: number) {
      const el = e.target as HTMLInputElement
      this.$set(this.rgba, index, parseInt(el.value || 0, 10))
    },
    genInput (target: string, value: number, change: (e: Event) => void, float: boolean = false): VNode {
      return this.$createElement('div', {
        staticClass: 'v-color-picker__input'
      }, [
        this.$createElement('input', {
          domProps: {
            value: float ? value : parseInt(value, 10)
          },
          on: {
            change
          }
        }),
        this.$createElement('span', target.toUpperCase())
      ])
    }
  },

  render (h): VNode {
    return this.$createElement('div', {
      staticClass: 'v-color-picker__edit'
    }, [
      this.genInput('r', this.rgba[0], (e: Event) => this.updateValue(e, 0)),
      this.genInput('g', this.rgba[1], (e: Event) => this.updateValue(e, 1)),
      this.genInput('b', this.rgba[2], (e: Event) => this.updateValue(e, 2)),
      this.genInput('a', this.rgba[3], (e: Event) => this.updateValue(e, 3), true)
    ])
  }
})