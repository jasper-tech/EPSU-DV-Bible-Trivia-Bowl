import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Quiz } from "../types/quiz";
interface ViewQuizDialogProps {
  quiz: Quiz | null;
  onClose: () => void;
}

const ViewQuizDialog = ({ quiz, onClose }: ViewQuizDialogProps) => {
  return (
    <Dialog open={!!quiz} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{quiz?.quizTitle}</DialogTitle>
      <DialogContent>
        {quiz && (
          <>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Created: {quiz.createdAt?.toDate().toLocaleString() || "N/A"}
            </Typography>

            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Questions ({quiz.questions.length})
            </Typography>

            {quiz.questions.map((question, index) => (
              <Box
                key={question.questionId}
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {index + 1}. {question.text}
                </Typography>

                <List dense>
                  {question.answers.map((answer) => (
                    <ListItem
                      key={answer.id}
                      sx={{
                        backgroundColor:
                          answer.id === question.correctAnswerId
                            ? "rgba(0, 255, 0, 0.1)"
                            : "transparent",
                        borderRadius: 1,
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
              </Box>
            ))}
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

export default ViewQuizDialog;
