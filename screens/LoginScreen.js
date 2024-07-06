import React, { useState } from 'react';
import { Button, Appbar, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity } from 'react-native';

const LoginScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.time}>9:41</Text>
      <Image source={{ uri: 'baby-icon-url' }} style={styles.icon} />
      <Text style={styles.loginText}>Login</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="Enter your email" />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Enter your password" secureTextEntry={true} />
      </View>
      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginButtonText}>→</Text>
      </TouchableOpacity>
      <Text style={styles.footerText}>eBabySitter</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9b59b6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  time: {
    fontSize: 18,
    position: 'absolute',
    top: 10,
    left: 10,
    color: '#fff',
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  inputContainer: {
    width: '80%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#fff',
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    fontSize: 24,
    color: '#9b59b6',
  },
  footerText: {
    fontSize: 18,
    color: '#fff',
    position: 'absolute',
    bottom: 10,
  },
});

export default LoginScreen;
