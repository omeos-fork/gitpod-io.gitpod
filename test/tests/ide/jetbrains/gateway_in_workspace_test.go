// Copyright (c) 2024 Gitpod GmbH. All rights reserved.
// Licensed under the GNU Affero General Public License (AGPL).
// See License.AGPL.txt in the project root for license information.

package ide

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"testing"
)

type testLogWriter struct {
	t *testing.T
}

var _ io.Writer = &testLogWriter{}

func (t *testLogWriter) Write(p []byte) (n int, err error) {
	t.t.Log(string(p))
	return len(p), nil
}

// TODO: make it false
const localDebug = true

func testWithoutGithubAction(ctx context.Context, t *testing.T, gatewayLink, gitpodAccessToken, secretEndpoint string, useLatest bool) error {
	if localDebug {
		fmt.Printf("========env========\n\ncd /workspace/gitpod/dev/jetbrains-test\nexport GATEWAY_LINK=%s\nexport GITPOD_TEST_ACCESSTOKEN=\"%s\"\nexport WS_ENDPOINT=%s\n./test.sh\n\nAccess https://28082-%s to see JetBrains UI", gatewayLink, gitpodAccessToken, secretEndpoint, secretEndpoint)
		os.Exit(1)
	}
	cmdEnv := os.Environ()
	cmdEnv = append(cmdEnv, "GATEWAY_LINK="+gatewayLink)
	cmdEnv = append(cmdEnv, "GITPOD_TEST_ACCESSTOKEN="+gitpodAccessToken)
	cmdEnv = append(cmdEnv, "WS_ENDPOINT="+secretEndpoint)

	scriptName := "dev/jetbrains-test:test-stable"
	if useLatest {
		scriptName = "dev/jetbrains-test:test-latest"
	}
	cmd := exec.CommandContext(ctx, "leeway", "run", scriptName, "-Dversion=integration-test", "-DpublishToJBMarketplace=false")
	cmd.Env = cmdEnv
	// writer := &testLogWriter{t: t}
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stdout
	return cmd.Run()
}
