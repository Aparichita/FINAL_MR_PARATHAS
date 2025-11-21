import { useMemo } from 'react'
import { FaArrowRight } from 'react-icons/fa'

import Button from '../components/common/Button.jsx'
import SectionHeading from '../components/common/SectionHeading.jsx'
import { useMenu } from '../hooks/useMenu.js'
import styles from './HomePage.module.css'

// Use a local image placed in `public/images/home-hero.jpg` (add the image file there)
const heroImage = '/images/home-hero.jpg'

const ambienceImage = '/images/home-ambience.jpg'

const HomePage = () => {
  const { data: menuItems = [], isLoading, isError } = useMenu()

  const featured = useMemo(() => {
    if (!Array.isArray(menuItems)) return []
    return menuItems.filter((item) => item?.category?.toLowerCase() !== 'drinks').slice(0, 4)
  }, [menuItems])

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} warm-gradient fade-soft`}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Modern North Indian Kitchen</p>
          <h1>Slow-fire parathas, smoked curries & family favourites.</h1>
          <p className={styles.lede}>
            A warm, family-friendly dining room inspired by home kitchens – serving seasonal menus,
            reinterpretations of heirloom recipes and dishes made to share.
          </p>
          <div className={styles.heroActions}>
            <Button to="/reservations" variant="ghost">
              Reserve a table
            </Button>
            <Button to="/menu" variant="ghost">
              Explore the menu
            </Button>
          </div>
        </div>
        <div className={`${styles.heroImage} food-card`} role="presentation" aria-hidden="true">
          <img src={heroImage} alt="Signature parathas on a rustic platter" loading="lazy" />
        </div>
      </section>

      <section className={styles.featured}>
        <SectionHeading
          eyebrow="Signature dishes"
          title="Hand-picked plates the city is talking about"
          description="Farm-fresh produce, stone-ground spices and clarified butter slow-infused for 12 hours – plated beautifully."
        />
        <div className={styles.cardGrid}>
          {isLoading && <p>Loading featured dishes…</p>}
          {isError && <p>We could not load the menu right now. Please try again shortly.</p>}
          {!isLoading && !isError && featured.length === 0 && <p>Menu items will appear here once added in the admin.</p>}
          {!isLoading &&
            !isError &&
            featured.map((item) => (
              <article key={item._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <p className={styles.cardCategory}>{item.category}</p>
                  <p className={styles.cardPrice}>₹{Number(item.price).toFixed(0)}</p>
                </div>
                <h3>{item.name}</h3>
                <p>{item.description || 'Chef-crafted specialty featuring seasonal produce.'}</p>
              </article>
            ))}
        </div>
      </section>

      <section className={styles.about}>
        <div className={styles.aboutContent}>
          <SectionHeading
            eyebrow="Our story"
            title="Born in a Punjabi kitchen, refined for today."
            description="Thoughtfully curated courses inspired by vibrant Punjabi dhabas and modern Indian bistros."
          />
          <ul className={styles.highlights}>
            <li>Seasonal tasting menu that changes every eight weeks</li>
            <li>Locally sourced grains milled fresh every morning</li>
            <li>Thoughtful beverage pairings and homely accompaniments</li>
          </ul>
        </div>
        <div className={styles.aboutImage}>
          <img src={ambienceImage} alt="Cozy dining room ambience" loading="lazy" />
        </div>
      </section>
    </div>
  )
}

export default HomePage

