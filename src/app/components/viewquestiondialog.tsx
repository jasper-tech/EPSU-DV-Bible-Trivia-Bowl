import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Question } from "../types/quiz";

interface ViewQuestionDialogProps {
  question: Question | null;
  onClose: () => void;
}

const ViewQuestionDialog = ({ question, onClose }: ViewQuestionDialogProps) => {
  return (
    <Dialog open={!!question} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Question Details</DialogTitle>
      <DialogContent>
        {question && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              <strong>Question:</strong> {question.text}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Explanation:</strong> {question.explanation}
            </Typography>
            <List>
              {question.answers.map((answer) => (
                <ListItem
                  key={answer.id}
                  sx={{
                    backgroundColor:
                      answer.id === question.correctAnswerId
                        ? "rgba(0, 255, 0, 0.1)"
                        : "transparent",
                  }}
                >
                  <ListItemText
                    primary={
                      <>
                        {answer.text}
                        {answer.id === question.correctAnswerId && (
                          <strong className="ml-2 text-green-600">
                            (Correct)
                          </strong>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewQuestionDialog;
