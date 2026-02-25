import React from "react"

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: unknown): ErrorBoundaryState {
    console.log('getDerivedStateFromError', _);
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.log('componentDidCatch', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) return <h1>Something went wrong.</h1>
    return this.props.children
  }
}

export default ErrorBoundary