import { Outlet } from 'react-router-dom'

import Footer from './Footer.jsx'
import Header from './Header.jsx'
import ScrollToTop from './ScrollToTop.jsx'
import styles from './MainLayout.module.css'
import ChatWidget from '../common/ChatWidget.jsx'

const MainLayout = () => {
  return (
    <div className={styles.appShell}>
      <ScrollToTop />
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <ChatWidget />
      <Footer />
    </div>
  )
}

export default MainLayout

