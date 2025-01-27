export { executeOnRenderClientHook }

import { assert, assertUsage, executeHook } from './utils'
import { getHook, type Hook } from '../shared/getHook'
import type { PageFile, PageContextExports } from '../shared/getPageFiles'
import {
  type PageContextForUserConsumptionClientSide,
  preparePageContextForUserConsumptionClientSide
} from './preparePageContextForUserConsumptionClientSide'
import type { PageConfig } from '../shared/page-configs/PageConfig'
import { getPageConfig } from '../shared/page-configs/utils'

async function executeOnRenderClientHook<
  PC extends {
    _pageFilesLoaded: PageFile[]
    urlOriginal?: string
    _pageId: string
    _pageConfigs: PageConfig[]
  } & PageContextExports &
    PageContextForUserConsumptionClientSide
>(pageContext: PC, isClientRouting: boolean): Promise<void> {
  const pageContextForUserConsumption = preparePageContextForUserConsumptionClientSide(pageContext, isClientRouting)

  let hook: null | Hook = null
  let hookName: 'render' | 'onRenderClient'

  {
    const renderHook = getHook(pageContext, 'render')
    hook = renderHook
    hookName = 'render'
  }
  {
    const renderHook = getHook(pageContext, 'onRenderClient')
    if (renderHook) {
      hook = renderHook
      hookName = 'onRenderClient'
    }
  }

  if (!hook) {
    const url = getUrl(pageContext)
    if (pageContext._pageConfigs.length > 0) {
      // V1 design
      assertUsage(
        false,
        `No onRenderClient() hook defined for URL '${url}', but it's needed, see https://vite-plugin-ssr.com/onRenderClient`
      )
    } else {
      // TODO/v1-release: remove
      // V0.4 design
      const pageClientsFilesLoaded = pageContext._pageFilesLoaded.filter((p) => p.fileType === '.page.client')
      let errMsg: string
      if (pageClientsFilesLoaded.length === 0) {
        errMsg = 'No file `*.page.client.*` found for URL ' + url
      } else {
        errMsg =
          'One of the following files should export a `render()` hook: ' +
          pageClientsFilesLoaded.map((p) => p.filePath).join(' ')
      }
      assertUsage(false, errMsg)
    }
  }

  assert(hook)
  const renderHook = hook.hookFn
  assert(hookName)

  // We don't use a try-catch wrapper because rendering errors are usually handled by the UI framework. (E.g. React's Error Boundaries.)
  const hookResult = await executeHook(() => renderHook(pageContextForUserConsumption), hookName, hook.hookFilePath)
  assertUsage(
    hookResult === undefined,
    `The ${hookName}() hook defined by ${hook.hookFilePath} isn't allowed to return a value`
  )
}

function getUrl(pageContext: { urlOriginal?: string }): string {
  let url: string | undefined
  // try/catch to avoid passToClient assertUsage(), although I'd expect this to not be needed since we're accessing pageContext and not pageContextForUserConsumption
  try {
    url = pageContext.urlOriginal
  } catch {}
  url = url ?? window.location.href
  return url
}
