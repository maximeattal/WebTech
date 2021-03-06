
/** @jsxImportSource @emotion/react */
import { useState } from 'react'
import axios from 'axios';
// Layout
import { Button, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/styles';
import { useContext } from 'react';
import Context from '../Context';
const useStyles = (theme) => {
  // See https://github.com/mui-org/material-ui/blob/next/packages/material-ui/src/OutlinedInput/OutlinedInput.js
  const borderColor = theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)';
  return {
    form: {
      borderTop: `2px solid ${borderColor}`,
      padding: '.5rem',
      display: 'flex',
      alignItems: 'center'
    },
    formLight: {
      borderTop: `2px solid #8693ab`,
      padding: '.5rem',
      display: 'flex',
      alignItems: 'center'
    },
    content: {
      flex: '1 1 auto',
      '&.MuiTextField-root': {
        marginRight: theme.spacing(1),
      },
    },
    specialOutline: {
      borderColor: "pink",
      borderWidth: 4
    }
  }
}

export default function Form({
  scrollDown,
  addMessage,
  channel,
}) {
  const [content, setContent] = useState('')
  const { oauth, darkMode } = useContext(Context)
  const styles = useStyles(useTheme())
  const onSubmit = async () => {
    const {data: message} = await axios.post(
      `http://localhost:3001/channels/${channel.id}/messages`
    , {
      content: content,
      author: `${oauth.email}`,
      }, {
      headers: {
        'Authorization': `Bearer ${oauth.access_token}`
      }
    })
    addMessage(message)
    setContent('')
    scrollDown()
  }
  const handleChange = (e) => {
    setContent(e.target.value)
  }
  return (
    <form css={darkMode ? styles.form : styles.formLight} onSubmit={onSubmit} noValidate>
      <TextField
        id="outlined-multiline-flexible"
        label="Message"
        multiline
        maxRows={4}
        value={content}
        onChange={handleChange}
        variant="outlined"
        css={styles.content}
        inputProps={{
          classes: {
            borderColor: "black"
          }
        }}

      />
      <div>
        <Button
          variant="contained"
          color="primary"
          css={styles.send}
          endIcon={<SendIcon />}
          onClick={onSubmit}
        >
          Send
        </Button>
      </div>
    </form>
  )
}
