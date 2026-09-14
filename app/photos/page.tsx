import type { Metadata } from 'next'
import Gallery from './gallery'
import { albums } from './albums'
import styles from './photos.module.css'
export const metadata: Metadata = { title: 'Photos | Max Ma', description: 'A photo journal from Rhodes, Paris, and Grindelwald.' }
export default function Photos() {
 return <div className={styles.journal}>
  <header className={styles.intro}><p className={styles.eyebrow}>THE PHOTO JOURNAL</p><h1>Out &amp; about.</h1><p className={styles.subtitle}>Places I’ve been, things I’ve seen, and life in between.</p>
  <nav className={styles.tripNav} aria-label="Jump to a trip">{albums.map(album=><a key={album.id} href={'#'+album.id}>{album.id === 'rhodes' ? 'Rhodes' : album.id === 'paris' ? 'Paris' : 'Grindelwald'} <span>↘</span></a>)}</nav></header>
  {albums.map((album,index)=><article key={album.id} id={album.id} className={styles.entry} aria-labelledby={album.id+'-title'}>
    <div className={styles.entryHeading}><div><p className={styles.eyebrow}>{album.place}</p><h2 id={album.id+'-title'}>{album.title}</h2></div><p className={styles.entryNote}>{album.intro}</p></div>
    <Gallery photos={album.photos} title={album.title} priority={index===0} />
  </article>)}
  <footer className={styles.footer}>More moments to come.</footer>
 </div>
}
