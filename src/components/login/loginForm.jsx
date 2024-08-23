"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  CircularProgress,
} from "@mui/material";
import { withStyles } from "@mui/styles";

const Text = withStyles({
  root: {
    color: "#000",
  },
})(Typography);

export default function LoginForm() {
  const [error, setError] = useState("");
  const router = useRouter();

  const initialValues = {
    email: "",
    password: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Please enter a valid email address.")
      .required("Email is required."),
    password: Yup.string()
      .required("Password is required.")
      .min(8, "Password should be of minimum 8 characters length"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");
    setSubmitting(true);

    const payload = {
      email: values.email,
      password: values.password,
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200) {
        const data = await response.json();
        console.log("Login successful:", data);
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Sign in failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
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
        // bgcolor: "background.paper",
        // boxShadow: 2,
        // borderRadius: 2,
      }}
    >
      <Text variant="h4" component="h2" gutterBottom textAlign="center">
        Sign In
      </Text>

      {error && (
        <Text color="error" textAlign="center" gutterBottom>
          {error}
        </Text>
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
          <Form noValidate autoComplete="off">
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              margin="normal"
              variant="outlined"
              autoComplete="off"
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

            <Box textAlign="right" my={2}>
              <Link href="/forgot-password" underline="hover">
                Forgot your password?
              </Link>
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} />}
              sx={{ mb: 2 }}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </Form>
        )}
      </Formik>

      <Text textAlign="center">
        Don’t have an account?{" "}
        <Link href="/register" underline="hover" color="primary">
          Sign Up
        </Link>
      </Text>
    </Box>
  );
}
