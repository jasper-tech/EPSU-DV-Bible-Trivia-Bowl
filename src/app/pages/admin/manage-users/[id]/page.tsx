"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import toast from "react-hot-toast";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Container,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const EditUser = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: "",
    role: "",
  });

  useEffect(() => {
    if (id) {
      fetchUserData(id);
    }
  }, [id]);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          image: data.image || "",
          role: data.role || "",
        });
      } else {
        toast.error("User not found");
        router.push("/pages/admin/manage-users");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Error fetching user data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleBack = () => {
    router.back();
  };

  const handleSaveChanges = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        name: formData.name,
        email: formData.email,
        image: formData.image,
        role: formData.role,
      });
      toast.success("User updated successfully!");
      router.push("/pages/admin/manage-users");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
      </Box>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" component="h6" gutterBottom>
          Edit User
        </Typography>

        <Box component="form" noValidate sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            disabled={saving}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={saving}
          />

          <TextField
            margin="normal"
            fullWidth
            id="image"
            label="Profile Image URL"
            name="image"
            value={formData.image}
            onChange={handleInputChange}
            disabled={saving}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="role"
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            disabled={saving}
          />

          <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              onClick={() => router.push("/pages/admin/manage-users")}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveChanges}
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditUser;
