import { useSelector, useDispatch } from 'react-redux'
import { increment, decrement, reset, selectCount } from './store/slices/counterSlice'

function App() {
  const count = useSelector(selectCount)
  const dispatch = useDispatch()

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-8">🧠 Brains</h1>
      <div className="bg-zinc-800 rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => dispatch(decrement())}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            -
          </button>
          <span className="text-3xl font-bold min-w-[80px] text-center">{count}</span>
          <button
            onClick={() => dispatch(increment())}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            +
          </button>
        </div>
        <button
          onClick={() => dispatch(reset())}
          className="w-full bg-zinc-600 hover:bg-zinc-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Reset
        </button>
        <p className="mt-4 text-zinc-400 text-sm text-center">
          Redux Toolkit Counter
        </p>
      </div>
    </div>
  )
}

export default App
