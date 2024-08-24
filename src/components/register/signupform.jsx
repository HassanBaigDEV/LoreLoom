"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import OutlinedInput from "@mui/material/OutlinedInput";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import FormHelperText from "@mui/material/FormHelperText";
import Text from "@/components/common/Text";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    loading: {
      primary: "#FFF",
    },
  },
});

const SignUpForm = React.memo(() => {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = useCallback(
    () => setShowPassword((show) => !show),
    []
  );

  const router = useRouter();

  const initialValues = useMemo(
    () => ({
      email: "",
      password: "",
      username: "",
      firstName: "",
      lastName: "",
    }),
    []
  );

  const handleMouseDownPassword = useCallback((event) => {
    event.preventDefault();
  }, []);

  const validationSchema = useMemo(
    () =>
      Yup.object({
        email: Yup.string()
          .email("Please enter a valid email address.")
          .required("Email is required."),
        password: Yup.string()
          .required("Password is required.")
          .min(8, "Password should be of minimum 8 characters length"),
        username: Yup.string()
          .required("Username is required.")
          .min(5, "Username should be of minimum 5 characters length"),
        firstName: Yup.string()
          .required("First Name is required.")
          .min(2, "First Name should be of minimum 2 characters length"),
        lastName: Yup.string()
          .required("Last Name is required.")
          .min(2, "Last Name should be of minimum 2 characters length"),
      }),
    []
  );

  const handleSubmit = useCallback(async (values, { setSubmitting }) => {
    setSubmitting(true);

    const payload = {
      email: values.email,
      password: values.password,
      username: values.username,
      first_name: values.firstName,
      last_name: values.lastName,
    };

    try {
      const response = await fetch("http://localhost:8081/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200) {
        const data = await response.json();
        console.log("Login successful:", data);
        // router.push("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Sign Up failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setSubmitting(false);
    }
  }, []);

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        p: 4,
      }}
    >
      <Text weight={600} size={24} style={{ color: "#4F4F4F", width: "100%" }}>
        Welcome to the Community!
      </Text>

      <Text
        style={{
          fontStyle: "italic",
          fontWeight: 400,
          color: "#808080",
          fontSize: 14,
          marginBottom: 20,
          marginTop: 5,
        }}
      >
        Please enter your details to Sign Up
      </Text>

      {error && <Text color="error">{error}</Text>}

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
            <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
              <InputLabel
                htmlFor="username"
                sx={{
                  color: Boolean(errors.username)
                    ? "#f44336"
                    : "rgba(0, 0, 0, 0.6)",
                }}
              >
                Username
              </InputLabel>
              <OutlinedInput
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
                autoComplete="off"
              />
              <FormHelperText
                id="username-helper-text"
                sx={{
                  color: Boolean(errors.email) ? "#f44336" : "None",
                }}
              >
                {" "}
                {errors.username}
              </FormHelperText>
            </FormControl>
            <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl sx={{ width: "100%" }} variant="outlined">
                    <InputLabel
                      htmlFor="firstName"
                      sx={{
                        color: Boolean(errors.firstName)
                          ? "#f44336"
                          : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      First Name
                    </InputLabel>
                    <OutlinedInput
                      id="firstName"
                      name="firstName"
                      label="First Name"
                      type="text"
                      value={values.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.firstName && Boolean(errors.firstName)}
                      helperText={touched.firstName && errors.firstName}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormHelperText
                      id="firstName-helper-text"
                      sx={{
                        color: Boolean(errors.firstName) ? "#f44336" : "None",
                      }}
                    >
                      {" "}
                      {errors.firstName}{" "}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl sx={{ width: "100%" }} variant="outlined">
                    <InputLabel
                      htmlFor="lastName"
                      sx={{
                        color: Boolean(errors.lastName)
                          ? "#f44336"
                          : "rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      Last Name
                    </InputLabel>
                    <OutlinedInput
                      id="lastName"
                      name="lastName"
                      label="Last Name"
                      type="text"
                      value={values.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.lastName && Boolean(errors.lastName)}
                      helperText={touched.lastName && errors.lastName}
                      margin="normal"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormHelperText
                      id="lastName-helper-text"
                      sx={{
                        color: Boolean(errors.lastName) ? "#f44336" : "None",
                      }}
                    >
                      {" "}
                      {errors.lastName}{" "}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </FormControl>
            <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
              <InputLabel
                htmlFor="email"
                sx={{
                  color: Boolean(errors.email)
                    ? "#f44336"
                    : "rgba(0, 0, 0, 0.6)",
                }}
              >
                Email
              </InputLabel>
              <OutlinedInput
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
              <FormHelperText
                id="email-helper-text"
                sx={{
                  color: Boolean(errors.email) ? "#f44336" : "None",
                }}
              >
                {" "}
                {errors.email}{" "}
              </FormHelperText>
            </FormControl>

            <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
              <InputLabel
                htmlFor="outlined-adornment-password"
                sx={{
                  color: Boolean(errors.password)
                    ? "#f44336"
                    : "rgba(0, 0, 0, 0.6)",
                }}
              >
                Password
              </InputLabel>
              <OutlinedInput
                fullWidth
                id="outlined-adornment-password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
                margin="normal"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                endAdornment={
                  <InputAdornment
                    position="end"
                    sx={{ cursor: "pointer" }}
                    style={{ backgroundColor: "transparent" }}
                    variant="standard"
                  >
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      style={{ backgroundColor: "transparent" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              <FormHelperText
                id="password-helper-text"
                sx={{
                  color: Boolean(errors.password) ? "#f44336" : "None",
                }}
              >
                {" "}
                {errors.password}{" "}
              </FormHelperText>
            </FormControl>

            <Box textAlign="right" my={2}>
              <Link
                href="/forgot-password"
                underline="disable"
                style={{ color: "rgba(255, 0, 0, 0.7)", fontSize: 12 }}
              >
                Forgot your password?
              </Link>
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              style={{ backgroundColor: "rgb(34 197 94)" }}
              type="submit"
              disabled={isSubmitting}
              startIcon={
                isSubmitting && (
                  <CircularProgress size={20} style={{ color: "#fff" }} />
                )
              }
              sx={{ mb: 2 }}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </Button>
          </Form>
        )}
      </Formik>

      <Text>
        Already have an account?{"     "}
        <Link
          href="/login"
          underline="disable"
          color="primary"
          style={{ marginLeft: 5, color: "rgb(34 197 94)" }}
        >
          Sign In
        </Link>
      </Text>
      {error && (
        <Typography color="error" variant="body2" align="center">
          {error}
        </Typography>
      )}
    </Box>
  );
});

export default SignUpForm;
