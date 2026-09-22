interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}
