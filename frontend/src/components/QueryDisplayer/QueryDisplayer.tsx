import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { Box, Button, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'
import { appActions, useAppDispatch, useAppSelector } from '../../AppState'

type QuestionItem = {
  answers: string[]
  question: string
  hints: string[]
}

type QueryDisplayerProps = {
  csvText: string // CSV data as a string
  hintInterval?: number // in milliseconds
  totalTime?: number // in milliseconds
}

type GroupedMap = Map<string, { hints: string[]; answers: string[] }>

export const QueryDisplayer: React.FC<QueryDisplayerProps> = ({
  csvText,
  hintInterval = 3000,
  totalTime = 18000,
}) => {
  const [usedQuestions, setUsedQuestions] = useState(new Set<string>(JSON.parse(localStorage.getItem('usedQuestion') || '[]')))
  const [current, setCurrent] = useState<QuestionItem | null>(null)
  const [hintIndex, setHintIndex] = useState(0)
  const [displayedHints, setDisplayedHints] = useState<string[]>([])
  const [remainingTime, setRemainingTime] = useState(totalTime)
  const [isRunning, setIsRunning] = useState(false)
  const [canGoNext, setCanGoNext] = useState(false)
  const [isOverflowed, setIsOverflowed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hintsHeight, setHintsHeight] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const dispatch = useAppDispatch()
  const allQuestions = useAppSelector((state) => state.app.allQuestions)
  const allAnswers = useAppSelector((state) => state.app.allAnswers)

  // Parse CSV when component mounts
  useEffect(() => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map((row: any) => ({
          question: row.Question,
          answer: row.Answer,
          hints: [
            row['Hint 1'],
            row['Hint 2'],
            row['Hint 3'],
            row['Hint 4'],
            row['Hint 5'],
            row['Hint 6'],
          ].filter(Boolean),
        }))
        const grouped: GroupedMap = new Map()

        for (const item of data) {
          if (!grouped.has(item.question)) {
            grouped.set(item.question, {
              hints: item.hints,
              answers: [item.answer],
            })
          } else {
            const entry = grouped.get(item.question)
            entry?.answers?.push(item.answer)
          }
        }
        dispatch(appActions.setAllQuestions( grouped))
      },
    })
    localStorage.setItem('isTimeOver', JSON.stringify(true))
  }, [csvText])

  const startQuestion = () => {
    if (usedQuestions.size === allQuestions.size) {
      alert('No more questions!')
      return
    }
    localStorage.setItem('isTimeOver', JSON.stringify(false))

    const entries = Array.from(allQuestions.entries())
    let index: number
    let correspondingQuestionId: string
    do {
      index = Math.floor(Math.random() * entries.length)
      correspondingQuestionId = entries[index][0]
    } while (usedQuestions.has(correspondingQuestionId))

    setUsedQuestions((prev) => {
      return new Set(prev).add(correspondingQuestionId)
    })

    const [questionID, qData] = entries[index]
    setCurrent({ question: questionID, ...qData }) // You can store questionID if needed
    localStorage.setItem("currentQuestId", questionID)
    setHintIndex(0)
    setDisplayedHints([qData.hints[0]])
    setRemainingTime(totalTime)
    setCanGoNext(false)
    setIsRunning(true)
    // Merge global state's allAnswers and localStorage's allAnswers
    const localAllAnswers = JSON.parse(localStorage.getItem('allAnswers') || '{}')
    const allAnswersClone = { ...localAllAnswers, ...allAnswers }
    allAnswersClone[questionID] = {
        start: new Date().toISOString(),
        end: '',
        answer: '',
        numberWrongs: 0,
      }
    dispatch(appActions.setAllAnswers(
      allAnswersClone
    ))
  }

  // Handle countdown timer
  useEffect(() => {
    if (!isRunning) return

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          if (timerRef.current && hintTimerRef.current) {
            clearInterval(timerRef.current)
            clearInterval(hintTimerRef.current)
          }
          setCanGoNext(true)
          setIsRunning(false)
          localStorage.setItem('usedQuestion', JSON.stringify([...usedQuestions]))
          dispatch(appActions.setEndInAllAnswers(
            {
              questionId: localStorage.getItem("currentQuestId") || "", 
              endTime: new Date().toISOString(), 
            }
          ))
          localStorage.setItem('isTimeOver', JSON.stringify(true))
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    hintTimerRef.current = setInterval(() => {
      setHintIndex((prevHint) => {
        if (!current) return prevHint
        const nextHint = prevHint + 1
        if (nextHint < current.hints.length) {
          setDisplayedHints((hints) => [...hints, current.hints[nextHint]])
        } else if (hintTimerRef.current) {
          clearInterval(hintTimerRef.current)
        }
        return nextHint
      })
    }, hintInterval)

    return () => {
      if (timerRef.current && hintTimerRef.current) {
        clearInterval(timerRef.current)
        clearInterval(hintTimerRef.current)
      }
    }
  }, [isRunning, current])

  // Check for overflow whenever displayed hints change
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        // Check if content height is greater than container height
        const isContentOverflowing =
          contentRef.current.scrollHeight > contentRef.current.clientHeight
        if (isContentOverflowing && !isOverflowed) setIsOverflowed(isContentOverflowing)
        setHintsHeight(contentRef.current.scrollHeight)
      }
    }

    // Use a small timeout to ensure DOM has updated
    const timeoutId = setTimeout(checkOverflow, 1)
    return () => clearTimeout(timeoutId)
  }, [displayedHints, current])

  const handleNext = () => {
    setCurrent(null)
    setDisplayedHints([])
    setHintIndex(0)
    setRemainingTime(totalTime)
    startQuestion()
  }

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        padding: '10px',
        width: '50%',
        margin: '0 auto',
        zIndex: 1,
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: 2,
        boxShadow: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        height: isHovered && isOverflowed ? hintsHeight : '50px',
        transition: 'height 0.3s ease',
      }}
    >
      {/* Question + Hints - 70% */}
      <Box
        sx={{
          width: '70%',
          height: '100%',
          overflow: 'hidden',
        }}
        ref={contentRef}
      >
        {current ? (
          <Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 'bold', mr: 1, display: 'inline' }}
            >
              {`${current.question}: `}
            </Typography>
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', display: 'inline' }}
            >
              {displayedHints.join(' ')}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="body1"
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            Click "Start" to begin the questions!
          </Typography>
        )}
      </Box>

      {/* Timer - 15% */}
      <Box sx={{ width: '15%', textAlign: 'center' }}>
        {current && (
          <Typography variant="h6" sx={{ color: 'red', fontWeight: 'bold' }}>
            {Math.floor(remainingTime / 60000)}:
            {Math.floor((remainingTime % 60000) / 1000)
              .toString()
              .padStart(2, '0')}
          </Typography>
        )}
      </Box>

      {/* Button - 15% */}
      <Box sx={{ width: '15%', textAlign: 'center' }}>
        {!current ? (
          <Button
            variant="contained"
            color="primary"
            onClick={startQuestion}
            disabled={isRunning}
          >
            Start
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            Next
          </Button>
        )}
      </Box>
    </Box>
  )
}
