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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

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
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
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
        username: Yup.string()
          .required("Username is required")
          .min(5, "Username must be at least 5 characters")
          .max(20, "Username must be less than 20 characters")
          .matches(
            /^[a-zA-Z0-9._-]+$/,
            "Username can only contain letters, numbers, periods, underscores, and hyphens"
          ),
        firstName: Yup.string()
          .required("First name is required")
          .min(2, "First name must be at least 2 characters")
          .matches(
            /^[A-Za-z]+$/,
            "First name can only contain letters (no numbers or special characters)"
          )
          .test(
            "is-capitalized",
            "First name should start with a capital letter",
            (value) => !value || /^[A-Z]/.test(value)
          ),
        lastName: Yup.string()
          .required("Last name is required")
          .min(2, "Last name must be at least 2 characters")
          .matches(
            /^[A-Za-z]+$/,
            "Last name can only contain letters (no numbers or special characters)"
          )
          .test(
            "is-capitalized",
            "Last name should start with a capital letter",
            (value) => !value || /^[A-Z]/.test(value)
          ),
        email: Yup.string()
          .required("Email is required")
          .matches(
            /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            "Please enter a valid email address (e.g. example@domain.com)"
          )
          .test("no-double-tld", "Invalid email domain format", (value) => {
            if (!value) return true;
            const domainParts = value.split("@")[1].split(".");
            
            return !(domainParts.length > 3);
          })
          .max(100, "Email must be less than 100 characters"),
        password: Yup.string()
          .required("Password is required")
          .min(8, "Password must be at least 8 characters")
          .max(50, "Password must be less than 50 characters")
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Must contain at least one uppercase letter, lowercase letter, number, and special character"
          ),
      }),
    []
  );

  const passwordCriteria = [
    {
      id: "length",
      label: "At least 8 characters long",
      regex: /.{8,}/,
    },
    {
      id: "uppercase",
      label: "Contains at least one uppercase letter",
      regex: /[A-Z]/,
    },
    {
      id: "lowercase",
      label: "Contains at least one lowercase letter",
      regex: /[a-z]/,
    },
    {
      id: "number",
      label: "Contains at least one number",
      regex: /\d/,
    },
    {
      id: "special",
      label: "Contains at least one special character",
      regex: /[@$!%*?&]/,
    },
  ];

  const checkPasswordCriteria = (password) => {
    return passwordCriteria.map((criterion) => ({
      ...criterion,
      valid: criterion.regex.test(password),
    }));
  };

  const handleSubmit = useCallback(
    async (values, { setSubmitting }) => {
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
          console.log("Sign up successful:", data);
          router.push("/dashboard");
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Sign Up failed. Please try again.");
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        console.error("Sign up error:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [router]
  );

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

      {error && (
        <Typography
          sx={{
            color: "error.main",
            bgcolor: "error.light",
            p: 1,
            borderRadius: 1,
            mb: 2,
          }}
        >
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
        }) => {
          const passwordValidationStatus = checkPasswordCriteria(
            values.password
          );
          return (
            <Form noValidate autoComplete="off">
              <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
                <InputLabel
                  htmlFor="username"
                  sx={{
                    color: Boolean(errors.username && touched.username)
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
                  margin="normal"
                  variant="outlined"
                  autoComplete="off"
                />
                {touched.username && errors.username && (
                  <FormHelperText error id="username-helper-text">
                    {errors.username}
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl sx={{ width: "100%" }} variant="outlined">
                      <InputLabel
                        htmlFor="firstName"
                        sx={{
                          color: Boolean(errors.firstName && touched.firstName)
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
                        margin="normal"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                      {touched.firstName && errors.firstName && (
                        <FormHelperText error id="firstName-helper-text">
                          {errors.firstName}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl sx={{ width: "100%" }} variant="outlined">
                      <InputLabel
                        htmlFor="lastName"
                        sx={{
                          color: Boolean(errors.lastName && touched.lastName)
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
                        margin="normal"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                      {touched.lastName && errors.lastName && (
                        <FormHelperText error id="lastName-helper-text">
                          {errors.lastName}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </FormControl>
              <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
                <InputLabel
                  htmlFor="email"
                  sx={{
                    color: Boolean(errors.email && touched.email)
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
                  margin="normal"
                  variant="outlined"
                  autoComplete="off"
                />
                {touched.email && errors.email && (
                  <FormHelperText error id="email-helper-text">
                    {errors.email}
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl sx={{ width: "100%", mt: 2 }} variant="outlined">
                <InputLabel
                  htmlFor="outlined-adornment-password"
                  sx={{
                    color: Boolean(errors.password && touched.password)
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
                  onChange={(e) => {
                    handleChange(e);
                    setShowPasswordCriteria(true);
                  }}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password) && !(
                    showPasswordCriteria && values.password && passwordValidationStatus.some(criterion => !criterion.valid)
                  )}
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
                {touched.password && errors.password && !(
                  showPasswordCriteria && values.password && passwordValidationStatus.some(criterion => !criterion.valid)
                ) && (
                  <FormHelperText error id="password-helper-text">
                    {errors.password}
                  </FormHelperText>
                )}

                {/* Password criteria checklist */}
                {showPasswordCriteria && values.password && passwordValidationStatus.some(criterion => !criterion.valid) && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: "bold",
                        color: "text.secondary",
                        display: "block",
                        mb: 1,
                      }}
                    >
                      Password must:
                    </Typography>
                    {passwordValidationStatus
                      .filter(criterion => !criterion.valid)
                      .map((criterion) => (
                        <Box key={criterion.id} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                          <CancelOutlinedIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {criterion.label}
                          </Typography>
                        </Box>
                    ))}
                  </Box>
                )}
              </FormControl>

              <Box textAlign="right" my={2}>
                <Link
                  href="/forgot-password"
                  underline="none"
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
          );
        }}
      </Formik>

      <Typography align="center" variant="body2" sx={{ mt: 2 }}>
        Already have an account?{"     "}
        <Link
          href="/login"
          underline="none"
          color="primary"
          style={{ marginLeft: 5, color: "rgb(34 197 94)" }}
        >
          Sign In
        </Link>
      </Typography>
    </Box>
  );
});

export default SignUpForm;
