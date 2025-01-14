export default Page

import React from 'react'
import { usePageContext } from '../../renderer/usePageContext'

function Page() {
  const ctx = usePageContext()
  let { is404, errorReason } = ctx
  if (!errorReason) {
    errorReason = is404 ? 'Page not found.' : 'Something went wrong.'
  }
  return (
    <Center>
      <p style={{ fontSize: '1.3em' }}>{errorReason}</p>
    </Center>
  )
}

function Center({ style, ...props }: any) {
  return (
    <div
      style={{
        height: 'calc(100vh - 100px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...style
      }}
      {...props}
    ></div>
  )
}
