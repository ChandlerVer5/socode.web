import React, { useEffect } from 'react'
import { useStoreActions } from './utils/hooks'
import Search from './components/search'
import Drawer from './components/drawer'
import ExtArrow from './components/extarrow'
import './styles/app.global.scss'

const Home: React.FC = () => {
  const initialStorage = useStoreActions(actions => actions.storage.initialStorage)
  const initialMetas = useStoreActions(actions => actions.devdocs.initialMetas)

  useEffect(() => {
    initialStorage()
    initialMetas()
  }, [initialStorage, initialMetas])

  return (
    <>
      <Search />
      <Drawer />
      {!document.body.classList.contains('socode_ext') && <ExtArrow />}
    </>
  )
}

export default Home
