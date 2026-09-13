import type { Metadata } from 'next'
import Gallery from './gallery'
import styles from './photos.module.css'

export const metadata: Metadata = {
  title: 'Photos | Max Ma',
  description: 'A photo journal of travel and life in between.',
}

export default function Photos() {
  return (
    <div className={styles.journal}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>THE PHOTO JOURNAL</p>
        <h1>Out &amp; about.</h1>
        <p className={styles.subtitle}>Places I’ve been, things I’ve seen, and life in between.</p>
      </header>
      <article aria-labelledby="entry-title">
        <div className={styles.entryHeading}>
          <div><p className={styles.eyebrow}>GRINDELWALD · FEBRUARY 2026</p><h2 id="entry-title">Winter in Grindelwald</h2></div>
          <p className={styles.entryNote}>Snow on the trees. Mountains beyond the window. A few moments from Grindelwald in February 2026.</p>
        </div>
        <Gallery />
      </article>
      <footer className={styles.footer}>More moments to come.</footer>
    </div>
  )
}

