import debounce from 'lodash.debounce'
import { onBeforeUnmount } from 'vue'
import { SEARCH_DEBOUNCE_MS } from '@/utils/constant'

export function useDebouncedSearch (callback: () => void) {
  const debouncedSearch = debounce(callback, SEARCH_DEBOUNCE_MS)

  function searchNow () {
    debouncedSearch.cancel()
    callback()
  }

  function searchLater () {
    debouncedSearch()
  }

  function cancelSearch () {
    debouncedSearch.cancel()
  }

  onBeforeUnmount(cancelSearch)

  return {
    searchNow,
    searchLater,
    cancelSearch,
  }
}
