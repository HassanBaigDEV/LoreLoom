"use client";

import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";

export default function RegisterForm() {
  const [error, setError] = useState("");

  const initialValues = {
    username: "",
    fullName: "",
    email: "",
    password: "",
    agreeToTerms: false,
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, "Username should be at least 3 characters long")
      .required("Username is required"),
    firstName: Yup.string()
      .min(2, "First name should be at least 2 characters long")
      .required("First name is required"),
    lastName: Yup.string()
      .min(2, "Last name should be at least 2 characters long")
      .required("Last name is required"),
    email: Yup.string()
      .email("Please enter a valid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password should be at least 8 characters long")
      .required("Password is required"),
    agreeToTerms: Yup.bool()
      .oneOf([true], "You must agree to the Privacy Policy and Terms")
      .required("Agreement is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");
    setSubmitting(true);

    const payload = {
      username: values.username,
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200) {
        console.log("Registration successful");
        // Redirect to the next step, such as login page
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        p: 4,
      }}
    >
      <Typography variant="h4" component="h2" gutterBottom textAlign="center">
        Sign Up
      </Typography>

      {error && (
        <Typography color="error" textAlign="center" gutterBottom>
          {error}
        </Typography>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          isSubmitting,
        }) => (
          <Form noValidate>
            <TextField
              fullWidth
              id="username"
              name="username"
              label="Username"
              value={values.username}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.username && Boolean(errors.username)}
              helperText={touched.username && errors.username}
              margin="normal"
              variant="outlined"
            />

            <TextField
              fullWidth
              id="firstName"
              name="firstName"
              label="First Name"
              value={values.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.firstName && Boolean(errors.firstName)}
              helperText={touched.firstName && errors.firstName}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              id="lastName"
              name="lastName"
              label="Last Name"
              value={values.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.lastName && Boolean(errors.lastName)}
              helperText={touched.lastName && errors.lastName}
              margin="normal"
              variant="outlined"
            />

            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              margin="normal"
              variant="outlined"
            />

            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password && Boolean(errors.password)}
              helperText={touched.password && errors.password}
              margin="normal"
              variant="outlined"
            />

            <FormControlLabel
              control={
                <Checkbox
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={values.agreeToTerms}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  By signing up, I agree to the{" "}
                  <Link href="#" underline="hover">
                    Privacy Policy
                  </Link>{" "}
                  and the{" "}
                  <Link href="#" underline="hover">
                    Terms and Conditions
                  </Link>
                  .
                </Typography>
              }
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} />}
              sx={{ mb: 2 }}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </Button>
          </Form>
        )}
      </Formik>

      <Typography textAlign="center">
        Already have an account?{" "}
        <Link href="/login" underline="hover" color="primary">
          Sign In
        </Link>
      </Typography>
    </Box>
  );
}
