import { Action, action, Thunk, thunk, Computed, computed } from 'easy-peasy'
import without from 'lodash/without'
import ky from 'ky'
import Fuse from 'fuse.js'
import SKeys, { SKey, SKeyCategory } from '../utils/searchkeys'
import { StoreModel } from './index'

const fuseOptions: Fuse.IFuseOptions<SKey> = {
  keys: ['name', 'shortkeys'],
  threshold: 0.3,
}

export interface SearchKeysModel {
  kquery: string
  setKquery: Action<SearchKeysModel, string>

  keys: Array<SKey>
  setKeys: Action<SearchKeysModel, Array<SKey>>
  initialKeys: Thunk<SearchKeysModel>

  pins: Array<string>
  addPin: Action<SearchKeysModel, string>
  removePin: Action<SearchKeysModel, string>
  pinKeys: Computed<SearchKeysModel, Array<SKey>>

  filteredKeys: Computed<SearchKeysModel, Array<SKey>, StoreModel>

  searchKeys: Computed<SearchKeysModel, Array<SKey>>
  cheatSheetsKeys: Computed<SearchKeysModel, Array<SKey>>
  collectionKeys: Computed<SearchKeysModel, Array<SKey>>
  learnKeys: Computed<SearchKeysModel, Array<SKey>>
  toolsKeys: Computed<SearchKeysModel, Array<SKey>>
  documentKeys: Computed<SearchKeysModel, Array<SKey>>

  searchedKeys: Computed<SearchKeysModel, Array<SKey>>

  currentKey: SKey
  setCurrentKey: Action<SearchKeysModel, SKey>
  initialCurrentKey: Action<SearchKeysModel>

  displayKeys: boolean
  setDisplayKeys: Action<SearchKeysModel, boolean>
}

const searchKeysModel: SearchKeysModel = {
  kquery: '',
  setKquery: action((state, payload) => {
    state.kquery = payload
  }),

  keys: SKeys,
  setKeys: action((state, payload) => {
    state.keys = payload
  }),
  initialKeys: thunk(async (actions) => {
    try {
      const skeys = await ky.get(`${process.env.REACT_APP_KEYS_HOST}/searchkeys.json`).json<Array<SKey>>()
      if (skeys !== null) {
        actions.setKeys(skeys)
      }
    } catch (err) {
      console.error(err)
    }
  }),

  pins: localStorage.getItem('pins')?.split(',') || [],
  addPin: action((state, pin) => {
    state.pins = [pin, ...state.pins]
    localStorage.setItem('pins', state.pins.toString())
  }),
  removePin: action((state, pin) => {
    state.pins = without(state.pins, pin)
    localStorage.setItem('pins', state.pins.toString())
  }),
  pinKeys: computed((state) => state.keys.filter((k) => state.pins.includes(k.code))),

  filteredKeys: computed(
    [
      (state) => state.keys,
      (state, storeState) => storeState.storage.settings.language,
      (state, storeState) => storeState.storage.region,
    ],
    (keys, language, region) => {
      return keys.filter((key) => {
        if (key.availableLang) {
          return key.availableLang === language
        }
        if (key.disableLang) {
          return key.disableLang !== language
        }
        if (key.forRegionCN && region !== 'CN') {
          return false
        }
        if (key.forRegionCN === false && region === 'CN') {
          return false
        }
        return true
      })
    }
  ),

  searchKeys: computed((state) => state.filteredKeys.filter((k) => k.category === SKeyCategory.Search)),
  cheatSheetsKeys: computed((state) => state.filteredKeys.filter((k) => k.category === SKeyCategory.CheatSheets)),
  collectionKeys: computed((state) => state.filteredKeys.filter((k) => k.category === SKeyCategory.Collection)),
  learnKeys: computed((state) => state.filteredKeys.filter((k) => k.category === SKeyCategory.Learn)),
  toolsKeys: computed((state) => state.filteredKeys.filter((k) => k.category === SKeyCategory.Tools)),
  documentKeys: computed((state) => state.filteredKeys.filter((k) => k.category === SKeyCategory.Document)),

  searchedKeys: computed((state) => {
    let ckeys = state.keys
    if (state.kquery) {
      const fuse = new Fuse(ckeys, fuseOptions)
      ckeys = fuse.search<SKey>(state.kquery).map((r) => r.item)
    }
    return ckeys
  }),

  currentKey: SKeys.find((k) => k.code === 'github') || SKeys[0],
  setCurrentKey: action((state, payload) => {
    state.currentKey = payload
    localStorage.setItem('currentKey', payload.code)
  }),
  initialCurrentKey: action((state) => {
    const params = new URLSearchParams(window.location.search)

    if (params.has('k')) {
      const key = state.keys.find((k) => k.code === params.get('k'))
      if (key) {
        state.currentKey = key
        return
      }
    }

    const code = localStorage.getItem('currentKey')
    const key = state.keys.find((k) => k.code === code)
    if (key && !key.devdocs) {
      state.currentKey = key
    }
  }),

  displayKeys: localStorage.getItem('displayKeys') !== 'false',
  setDisplayKeys: action((state, payload) => {
    state.displayKeys = payload
    localStorage.setItem('displayKeys', payload.toString())
  }),
}

export default searchKeysModel
