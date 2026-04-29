pipeline {
  agent any

  options {
    timestamps()
    skipDefaultCheckout(false)
  }

  environment {
    CI = 'true'
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Fast feedback') {
      parallel {
        stage('Lint') {
          steps {
            sh 'npm run lint'
          }
        }
        stage('Unit and component tests') {
          steps {
            sh 'npm run test:unit:ci'
          }
        }
      }
    }

    stage('E2E smoke') {
      steps {
        sh 'npx playwright install chromium'
        sh 'npm run test:e2e'
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'reports/**/junit.xml'
      archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/**'
    }
  }
}
