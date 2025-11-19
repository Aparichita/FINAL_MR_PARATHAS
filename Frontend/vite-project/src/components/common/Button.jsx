import clsx from 'clsx'
import { Link } from 'react-router-dom'

import styles from './Button.module.css'

const Button = ({
  children,
  to,
  variant = 'primary',
  size = 'md',
  className,
  icon,
  ...rest
}) => {
  const Component = to ? Link : 'button'

  return (
    <Component
      className={clsx(styles.button, styles[variant], styles[size], className)}
      to={to}
      {...(!to && { type: rest.type || 'button' })}
      {...rest}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </Component>
  )
}

export default Button

